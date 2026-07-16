import { Schema, model, models, Types } from 'mongoose';

export interface ISubtopicActivity {
  _id:         Types.ObjectId;
  citizenId:   Types.ObjectId;
  subtopicId:  Types.ObjectId;
  topicId:     Types.ObjectId;
  moduleId:    Types.ObjectId;

  liked:       boolean;
  likedAt?:    Date;

  completed:   boolean;
  completedAt?: Date;

  createdAt:   Date;
  updatedAt:   Date;
}

const SubtopicActivitySchema = new Schema<ISubtopicActivity>(
  {
    citizenId:  { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subtopicId: { type: Schema.Types.ObjectId, ref: 'AdminSubTopic', required: true, index: true },
    topicId:    { type: Schema.Types.ObjectId, ref: 'AdminTopic', required: true, index: true },
    moduleId:   { type: Schema.Types.ObjectId, ref: 'AdminModule', required: true, index: true },

    liked:       { type: Boolean, default: false },
    likedAt:     { type: Date },

    completed:   { type: Boolean, default: false },
    completedAt: { type: Date },
  },
  { timestamps: true, collection: 'subtopic_activity' }
);

SubtopicActivitySchema.index({ citizenId: 1, subtopicId: 1 }, { unique: true });
SubtopicActivitySchema.index({ citizenId: 1, topicId: 1 });

export const SubtopicActivityModel =
  models.SubtopicActivity || model<ISubtopicActivity>('SubtopicActivity', SubtopicActivitySchema);


export interface ISubtopicBookmark {
  _id:             Types.ObjectId;
  citizenId:       Types.ObjectId;
  subtopicId:      Types.ObjectId;
  topicId:         Types.ObjectId;
  moduleId:        Types.ObjectId;

  url:             string

  // Denormalised for fast list rendering without extra populates
  subtopicTitle:   string;
  topicTitle:      string;
  moduleTitle:     string;

  highlightedText: string;   // the exact passage the citizen selected
  comment:         string;   // citizen's own note attached to the highlight

  startOffset?:    number;
  endOffset?:      number;

  createdAt:       Date;
  updatedAt:       Date;
}

const SubtopicBookmarkSchema = new Schema<ISubtopicBookmark>(
  {
    citizenId:  { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subtopicId: { type: Schema.Types.ObjectId, ref: 'AdminSubTopic', required: true, index: true },
    topicId:    { type: Schema.Types.ObjectId, ref: 'AdminTopic', required: true, index: true },
    moduleId:   { type: Schema.Types.ObjectId, ref: 'AdminModule', required: true, index: true },


    url:   { type: String, required: true, default: "/"},

    subtopicTitle: { type: String, default: '' },
    topicTitle:    { type: String, default: '' },
    moduleTitle:   { type: String, default: '' },

    highlightedText: { type: String, required: true, trim: true },
    comment:         { type: String, default: '', trim: true },

    startOffset: { type: Number },
    endOffset:   { type: Number },
  },
  { timestamps: true, collection: 'subtopic_bookmarks' }
);

SubtopicBookmarkSchema.index({ citizenId: 1, subtopicId: 1, createdAt: -1 });
SubtopicBookmarkSchema.index({ citizenId: 1, createdAt: -1 });

export const SubtopicBookmarkModel =
  models.SubtopicBookmark || model<ISubtopicBookmark>('SubtopicBookmark', SubtopicBookmarkSchema);