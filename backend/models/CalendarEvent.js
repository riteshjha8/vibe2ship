import mongoose from 'mongoose';

const calendarEventSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    location: { type: String, default: '' },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    timezone: { type: String, default: 'Asia/Kolkata' },
    allDay: { type: Boolean, default: false },
    source: { type: String, default: 'manual' },
  },
  { timestamps: true }
);

// `user` is indexed on the field; index the start time for queries
calendarEventSchema.index({ startAt: 1 });

export default mongoose.model('CalendarEvent', calendarEventSchema);
