import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    title: String,
    hours: Number,
    type: { type: String, enum: ['learn', 'build', 'practice'], default: 'learn' },
    completed: { type: Boolean, default: false },
  },
  { _id: true }
);

const resourceSchema = new mongoose.Schema(
  {
    title: String,
    url: String,
    type: { type: String, enum: ['video', 'article', 'course', 'docs'], default: 'article' },
  },
  { _id: false }
);

const weekSchema = new mongoose.Schema(
  {
    weekNumber: Number,
    theme: String,
    goals: [String],
    tasks: [taskSchema],
    resources: [resourceSchema],
    milestone: String,
    completed: { type: Boolean, default: false },
  },
  { _id: true }
);

const roadmapSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: String,
    targetRole: String,
    currentSkills: [String],
    hoursPerWeek: Number,
    totalWeeks: Number,
    skillsToGain: [String],
    weeks: [weekSchema],
  },
  { timestamps: true }
);

roadmapSchema.virtual('completedPct').get(function () {
  const total = this.weeks.reduce((a, w) => a + w.tasks.length, 0);
  if (!total) return 0;
  const done = this.weeks.reduce((a, w) => a + w.tasks.filter((t) => t.completed).length, 0);
  return Math.round((done / total) * 100);
});
roadmapSchema.set('toJSON', { virtuals: true });

export default mongoose.model('Roadmap', roadmapSchema);
