import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  action: { 
    type: String, 
    required: true,
    enum: ['LOGIN', 
      'PROFILE_UPDATE', 
      'SESSION_CREATED', 
      'SESSION_EDITED', 
      'SESSION_DELETED', 
      'OFFLINE_SYNC'
    ]
  },
  details: { 
    type: Object, 
    default: {} 
  },
  ipAddress: {
    type: String,
    default: 'unknown'
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
});

export default mongoose.model('AuditLog', auditLogSchema);