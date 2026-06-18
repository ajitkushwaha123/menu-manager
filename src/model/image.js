import mongoose from "mongoose";

const ImageSchema = new mongoose.Schema({
    title: { type: String, required: true, index: true },
    description: { type: String },
    manual_tags: [{ type: String }],
    auto_tags: [{ type: String }],
    cuisine: { type: String },
    image_url: { type: String, required: true },
    approved: { type: Boolean, default: false },
    system_approved: { type: Boolean, default: true },
    premium: { type: Boolean, default: false },
    quality_score: { type: Number, default: 0 },
    popularity_score: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    category: { type: String },
    sub_category: { type: String },
    food_type: { type: String },
    downloads: { type: Number, default: 0 },
    source: { type: String },
    isCombo: { type: Boolean, default: false },
    isThali: { type: Boolean, default: false },
    latest: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.models.Image || mongoose.model("Image", ImageSchema);
