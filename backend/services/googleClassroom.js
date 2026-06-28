/**
 * Google Classroom submission helper (scaffold)
 *
 * NOTE: This file provides a scaffold for integrating with Google Classroom.
 * To enable real submissions you must:
 *  - Create OAuth 2.0 credentials in Google Cloud Console (OAuth Client ID)
 *  - Set environment variables: OAUTH_GOOGLE-CLASSROOM_CLIENT_ID and _CLIENT_SECRET
 *  - Ensure the redirect URI matches /api/integrations/oauth/callback
 *  - The user's OAuth tokens will be stored in `user.integrations['google-classroom'].oauth`
 *  - Use the token to call Google Classroom APIs and Drive to upload files and attach as coursework materials.
 *
 * For now this helper attempts to detect tokens and returns a helpful message if not configured.
 */

import { google } from "googleapis";
import stream from "stream";

function envVar(...names) {
  for (const n of names) {
    if (process.env[n]) return process.env[n];
  }
  return null;
}

async function submitAssignmentToGoogleClassroom(assignment, user) {
  const cfg = user.integrations && user.integrations["google-classroom"];
  if (!cfg || !cfg.oauth || !cfg.oauth.accessToken) {
    return { success: false, error: "Google Classroom not connected or OAuth tokens missing." };
  }

  const clientId = envVar("OAUTH_GOOGLE_CLASSROOM_CLIENT_ID", "OAUTH_GOOGLE_CLASSROOM_CLIENT_ID", "OAUTH_GOOGLE_CLASSROOM_CLIENTID");
  const clientSecret = envVar("OAUTH_GOOGLE_CLASSROOM_CLIENT_SECRET", "OAUTH_GOOGLE_CLASSROOM_CLIENT_SECRET", "OAUTH_GOOGLE_CLASSROOM_CLIENTSECRET");
  const redirectUri = `${process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`}/api/integrations/oauth/callback`;

  if (!clientId || !clientSecret) {
    return { success: false, error: "Server OAuth client not configured. Set OAUTH_GOOGLE_CLASSROOM_CLIENT_ID and _CLIENT_SECRET." };
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  oauth2Client.setCredentials({
    access_token: cfg.oauth.accessToken,
    refresh_token: cfg.oauth.refreshToken || undefined,
    expiry_date: cfg.oauth.expiresIn ? Date.now() + Number(cfg.oauth.expiresIn) * 1000 : undefined,
  });

  try {
    const drive = google.drive({ version: "v3", auth: oauth2Client });
    const classroom = google.classroom({ version: "v1", auth: oauth2Client });

    // Upload file to Drive
    const bufferStream = new stream.PassThrough();
    bufferStream.end(assignment.fileData);

    const createRes = await drive.files.create({
      requestBody: {
        name: assignment.filename,
        mimeType: assignment.contentType || "application/octet-stream",
        parents: [],
        properties: { assignmentId: String(assignment._id) },
      },
      media: {
        mimeType: assignment.contentType || "application/octet-stream",
        body: bufferStream,
      },
      fields: "id,webViewLink,webContentLink",
    });

    const fileId = createRes?.data?.id;
    const webViewLink = createRes?.data?.webViewLink || null;

    if (!fileId) {
      return { success: false, error: "Drive upload failed: no fileId returned." };
    }

    // Try to extract courseId and courseworkId from assignment metadata
    let courseId = null;
    let courseWorkId = null;
    try {
      if (assignment.platformLink && typeof assignment.platformLink === "string") {
        const m = assignment.platformLink.match(/classroom\.google\.com\/c\/([A-Za-z0-9_-]+)/i);
        if (m) courseId = m[1];
      }
      if (assignment.platformId) {
        courseWorkId = assignment.platformId;
      }
      // If platformLink contains both ids like /c/COURSE_ID/assignments/COURSEWORK_ID
      if (!courseWorkId && assignment.platformLink) {
        const m2 = assignment.platformLink.match(/courseWork(?:s)?\/(?:d\/)?([A-Za-z0-9_-]+)/i) || assignment.platformLink.match(/assignments\/(?:d\/)?([A-Za-z0-9_-]+)/i);
        if (m2) courseWorkId = m2[1];
      }
    } catch (e) {
      // ignore
    }

    // If we have both, attempt to attach and turn in the student's submission
    if (courseId && courseWorkId) {
      try {
        // List student submissions for this coursework for the authenticated student ('me')
        const listRes = await classroom.courses.courseWork.studentSubmissions.list({
          courseId,
          courseWorkId,
          userId: "me",
        });

        const submissions = listRes?.data?.studentSubmissions || [];
        let submission = submissions[0];

        if (!submission || !submission.id) {
          // No existing submission found — try to create one by calling create (best-effort)
          try {
            const createSub = await classroom.courses.courseWork.studentSubmissions.create({
              courseId,
              courseWorkId,
              requestBody: {},
            });
            submission = createSub?.data;
          } catch (err) {
            // creating student submission may not be allowed — continue with best-effort messaging
            submission = null;
          }
        }

        if (submission && submission.id) {
          // Attach the Drive file as a submission attachment (draft)
          const patchRes = await classroom.courses.courseWork.studentSubmissions.patch({
            courseId,
            courseWorkId,
            id: submission.id,
            updateMask: "draftStudentSubmission.submissionAttachments",
            requestBody: {
              draftStudentSubmission: {
                submissionAttachments: [
                  {
                    driveFile: { id: fileId },
                  },
                ],
              },
            },
          });

          // Try to turn in the submission
          try {
            await classroom.courses.courseWork.studentSubmissions.turnIn({
              courseId,
              courseWorkId,
              id: submission.id,
            });
          } catch (turnErr) {
            // turning in may fail depending on teacher settings; we still consider upload success
            return { success: true, uploadedToDrive: true, fileId, webViewLink, message: "Uploaded to Drive and attached to student submission, but turn-in may have failed.", turnInError: String(turnErr.message || turnErr) };
          }

          return { success: true, uploadedToDrive: true, fileId, webViewLink, message: "Uploaded and submitted to Google Classroom." };
        }
      } catch (err) {
        // Log but proceed to return Drive link
        console.warn("Google Classroom attach/submit step failed:", err.message || err);
        return { success: true, uploadedToDrive: true, fileId, webViewLink, message: "Uploaded to Drive but could not attach/turn-in submission: " + String(err.message || err) };
      }
    }

    return { success: true, uploadedToDrive: true, fileId, webViewLink, message: "File uploaded to Drive. Provide courseId/courseWorkId to attach/submit to Classroom." };
  } catch (err) {
    console.error("Google Classroom submission error:", err.message || err);
    return { success: false, error: err.message || String(err) };
  }
}

export { submitAssignmentToGoogleClassroom };
