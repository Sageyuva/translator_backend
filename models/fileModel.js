const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  clientId: { type: String, required: true },
  clientname: { type: String, required: true },
  clientemail: { type: String, required: true },
  originalFilePath: { type: String, required: true },
  translatedFilePath: { type: String },
  fromLanguage: { type: String, required: true },
  toLanguage: { type: String, required: true },
  status: { type: String, enum: ['Uploaded', 'In Progress', 'Completed'], default: 'Uploaded' },
  tat: { type: String },
});

module.exports = mongoose.model('File', fileSchema);