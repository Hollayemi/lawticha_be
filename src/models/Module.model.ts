import { Schema, model, models, Document, Types } from 'mongoose';

//  Enums 

export type ModuleCategory =  | 'criminal' | 'tenancy' | 'employment' | 'contracts'
  | 'business' | 'family' | 'consumer' | 'road';

export type ModuleStatus  = 'active' | 'inactive' | 'pending';
export type TopicStatus   = 'published' | 'draft' | 'pending';
export type VideoType     = 'youtube' | 'upload';
export type ActivityAction =
  | 'completed' | 'enrolled' | 'liked' | 'commented' | 'watched' | 'started';
export type TargetType = 'topic' | 'module' | 'subtopic';

//  SubTopic 

export interface ISubTopic {
  _id:             Types.ObjectId;
  topicId:         Types.ObjectId;
  moduleId:        Types.ObjectId;
  title:           string;
  slug:            string;
  notes:           string;   // instructor script – admin only
  duration:        string;   // e.g. "4:32"
  durationSeconds: number;
  order:           number;
  viewCount:       number;
  completedBy:     number;
  createdAt:       Date;
  updatedAt:       Date;
}

const SubTopicSchema = new Schema<ISubTopic>(
  {
    topicId:         { type: Schema.Types.ObjectId, ref: 'AdminTopic', required: true, index: true },
    moduleId:        { type: Schema.Types.ObjectId, ref: 'AdminModule', required: true, index: true },
    title:           { type: String, required: true, trim: true },
    slug:           { type: String, required: true, trim: true },
    notes:           { type: String, default: '' },
    duration:        { type: String, default: '0:00' },
    durationSeconds: { type: Number, default: 0 },
    order:           { type: Number, required: true, default: 1 },
    viewCount:       { type: Number, default: 0 },
    completedBy:     { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'admin_subtopics' }
);

SubTopicSchema.index({ topicId: 1, order: 1 });

export const SubTopicModel =
  models.AdminSubTopic || model<ISubTopic>('AdminSubTopic', SubTopicSchema);



//  Topic 

export interface ITopic {
  _id:            Types.ObjectId;
  moduleId:       Types.ObjectId;
  title:          string;
  slug :          string;
  classification: string;
  overview:       string;
  status:         TopicStatus;
  order:          number;
  videoType:      VideoType | null;
  videoUrl:       string;
  thumbnailUrl:   string;
  duration:       string;
  durationSeconds: number;
  watchCount:     number;
  completionRate: number;
  likes:          number;
  comments:       number;
  tags:           string[];
  subtopicCount:  number;
  createdAt:      Date;
  updatedAt:      Date;
}

const TopicSchema = new Schema<ITopic>(
  {
    moduleId:       { type: Schema.Types.ObjectId, ref: 'AdminModule', required: true, index: true },
    title:          { type: String, required: true, trim: true },
    slug:          { type: String, required: true, trim: true },
    classification: { type: String, default: '' },
    overview:       { type: String, default: '' },
    status:         { type: String, enum: ['published', 'draft', 'pending'], default: 'draft' },
    order:          { type: Number, required: true, default: 1 },
    videoType:      { type: String, enum: ['youtube', 'upload', null], default: null },
    videoUrl:       { type: String, default: '' },
    thumbnailUrl:   { type: String, default: '' },
    duration:       { type: String, default: '0:00' },
    durationSeconds: { type: Number, default: 0 },
    watchCount:     { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },
    likes:          { type: Number, default: 0 },
    comments:       { type: Number, default: 0 },
    tags:           [{ type: String }],
    subtopicCount:  { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'admin_topics' }
);

TopicSchema.index({ moduleId: 1, order: 1 });
TopicSchema.index({ moduleId: 1, status: 1 });

export const TopicModel =
  models.AdminTopic || model<ITopic>('AdminTopic', TopicSchema);

//  Module 

export interface IModule {
  _id:                Types.ObjectId;
  title:              string;
  slug:               string;
  category:           ModuleCategory;
  status:             ModuleStatus;
  thumbnail:          string | null;
  description:        string;
  materialSummary:    object;
  topicCount:         number;
  enrolledCount:      number;
  completionRate:     number;
  avgRating:          number;
  reviewCount:        number;
  totalWatchTimeHours: number;
  instructor:         string;
  instructorId:       Types.ObjectId;
  instructorInitials: string;
  instructorColor:    string;
  trending:           boolean;
  createdAt:          Date;
  updatedAt:          Date;
}

const ModuleSchema = new Schema<IModule>(
  {
    title:       { type: String, required: true, trim: true },
    slug:        { type: String, required: true, trim: true },
    category:    {
      type: String,
      required: true,
      enum: ['criminal','tenancy','employment','contracts','business','family','consumer','road'],
    },
    status:      { type: String, enum: ['active','inactive','pending'], default: 'pending' },
    thumbnail:   { type: String, default: null },
    description: { type: String, default: '' },
    topicCount:  { type: Number, default: 0 },

    materialSummary: { type: Object, default: null },

    // Denorm stats – updated by background jobs / service calls
    enrolledCount:      { type: Number, default: 0 },
    completionRate:     { type: Number, default: 0 },
    avgRating:          { type: Number, default: 0 },
    reviewCount:        { type: Number, default: 0 },
    totalWatchTimeHours:{ type: Number, default: 0 },

    // Instructor fields (denorm from LawyerProfile/AdminUser)
    instructor:         { type: String, default: '' },
    instructorId:       { type: Schema.Types.ObjectId, required: true },
    instructorInitials: { type: String, default: '' },
    instructorColor:    { type: String, default: '#1E3A5F' },

    trending: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'admin_modules' }
);

ModuleSchema.index({ status: 1 });
ModuleSchema.index({ category: 1 });
ModuleSchema.index({ trending: 1 });
ModuleSchema.index({ title: 'text', description: 'text' });

export const ModuleModel =
  models.AdminModule || model<IModule>('AdminModule', ModuleSchema);

//  Activity 

export interface IActivityItem {
  _id:         Types.ObjectId;
  userId:      Types.ObjectId;
  userName:    string;
  userInitials: string;
  userColor:   string;
  action:      ActivityAction;
  targetTitle: string;
  targetType:  TargetType;
  targetId:    Types.ObjectId;
  moduleId:    Types.ObjectId;
  createdAt:   Date;
}

const ActivitySchema = new Schema<IActivityItem>(
  {
    userId:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName:    { type: String, required: true },
    userInitials:{ type: String, default: '' },
    userColor:   { type: String, default: '#1E3A5F' },
    action:      {
      type: String,
      required: true,
      enum: ['completed','enrolled','liked','commented','watched','started'],
    },
    targetTitle: { type: String, required: true },
    targetType:  { type: String, required: true, enum: ['topic','module','subtopic'] },
    targetId:    { type: Schema.Types.ObjectId, required: true },
    moduleId:    { type: Schema.Types.ObjectId, ref: 'AdminModule', required: true, index: true },
  },
  { timestamps: true, collection: 'admin_activity' }
);

ActivitySchema.index({ moduleId: 1, createdAt: -1 });

export const ActivityModel =
  models.AdminActivity || model<IActivityItem>('AdminActivity', ActivitySchema);

//  Comment 

export interface IComment {
  _id:          Types.ObjectId;
  topicId:      Types.ObjectId;
  moduleId:     Types.ObjectId;
  userId:       Types.ObjectId;
  userName:     string;
  userInitials: string;
  userColor:    string;
  text:         string;
  likes:        number;
  resolved:     boolean;
  resolvedBy?:  string;
  resolvedAt?:  Date;
  parentId?:    Types.ObjectId;
  replies?:     IComment[];
  createdAt:    Date;
  updatedAt:    Date;
}

const CommentSchema = new Schema<IComment>(
  {
    topicId:      { type: Schema.Types.ObjectId, ref: 'AdminTopic',  required: true, index: true },
    moduleId:     { type: Schema.Types.ObjectId, ref: 'AdminModule', required: true, index: true },
    userId:       { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName:     { type: String, required: true },
    userInitials: { type: String, default: '' },
    userColor:    { type: String, default: '#1E3A5F' },
    text:         { type: String, required: true },
    likes:        { type: Number, default: 0 },
    resolved:     { type: Boolean, default: false, index: true },
    resolvedBy:   { type: String },
    resolvedAt:   { type: Date },
    parentId:     { type: Schema.Types.ObjectId, ref: 'AdminComment', default: null },
  },
  { timestamps: true, collection: 'admin_comments' }
);

CommentSchema.index({ topicId: 1, resolved: 1, createdAt: -1 });
CommentSchema.index({ parentId: 1 });

export const CommentModel =
  models.AdminComment || model<IComment>('AdminComment', CommentSchema);