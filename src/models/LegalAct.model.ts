import { Schema, model, models } from 'mongoose';
import { ILegalAct, IBookmark } from './types';

/**
 * LEGAL ACT  (legislation in the library)
 * Represents one piece of Nigerian legislation with both plain-English
 * summary and statutory text.
 *
 * From: library/page.tsx          → act cards, search, filter
 *       learn/[slug]/page.tsx     → "Section 35 — Full Text Explained"
 *       dashboard/page.tsx        → BOOKMARKS list
 *       dashboard/learn/[slug]    → "Talk to a lawyer nudge" links to topic
 */
const LegalActSectionSchema = new Schema(
  {
    number:      { type: String },    // "35" or "11(1)(a)"
    title:       { type: String },
    plainText:   { type: String },    // plain-English summary of this section
    statutoryText: { type: String },  // verbatim legal text
  },
  { _id: true }
);

const LegalActSchema = new Schema<ILegalAct>(
  {
    slug:    { type: String, required: true, unique: true, trim: true },
    title:   { type: String, required: true },
    chapter: { type: String },   // "Cap. L1, Laws of the Federation"
    year:    { type: String },   // "2004" or "1999 (as amended)"
    category: {
      type: String,
      required: true,
      index: true,
    },                           // "Employment", "Tenancy", "Criminal"...
    accentColor: { type: String },

    //  Content 
    summary:         { type: String }, // full plain-English intro paragraph
    sections:        [LegalActSectionSchema],
    sectionCount:    { type: Number, default: 0 }, // denorm
    tags:            [{ type: String }],            // ["Contracts","Wages","Leave"]

    //  Jurisdiction 
    jurisdiction: {
      type: String,
      enum: ['federal', 'state'],
      default: 'federal',
      index: true,
    },
    stateCode: { type: String },  // if jurisdiction = 'state'

    //  Meta 
    isPublished:  { type: Boolean, default: true, index: true },
    viewCount:    { type: Number, default: 0 },
    lastAmendedAt: { type: Date },
  },
  {
    timestamps: true,
    collection: 'legal_acts',
  }
);

LegalActSchema.index({ category: 1, isPublished: 1 });
LegalActSchema.index({ tags: 1 });
// Full-text search index
LegalActSchema.index({ title: 'text', summary: 'text', tags: 'text' });

export const LegalActModel =
  models.LegalAct || model<ILegalAct>('LegalAct', LegalActSchema);

// 

/**
 * BOOKMARK
 * A citizen's saved reference — can be a LegalAct section or a module lesson.
 *
 * From: dashboard/page.tsx → BOOKMARKS list (title, law name, accent colour)
 *       dashboard/learn/page.tsx → Bookmark button on module card
 */
const BookmarkSchema = new Schema<IBookmark>(
  {
    citizenId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // What is bookmarked — one of:
    refType: {
      type: String,
      enum: ['legal_act', 'module', 'lesson'],
      required: true,
    },
    refId:      { type: Schema.Types.ObjectId, required: true },
    sectionId:  { type: Schema.Types.ObjectId }, // if bookmarking a specific section

    // Denormalised for quick list rendering (no populate needed)
    title:       { type: String, required: true },   // "Section 35 — Right to Personal Liberty"
    sourceName:  { type: String },                   // "1999 Constitution" or module title
    accentColor: { type: String },                   // "#E8317A"
  },
  {
    timestamps: true,
    collection: 'bookmarks',
  }
);

BookmarkSchema.index({ citizenId: 1, refType: 1 });
BookmarkSchema.index({ citizenId: 1, refId: 1 }, { unique: true });

export const BookmarkModel =
  models.Bookmark || model<IBookmark>('Bookmark', BookmarkSchema);
