const settingSchema = {
  type: 'object',
  properties: {
    _id: { type: String, required: false },
    index: { type: Number, required: true },
    name: { type: String, required: true },
    displayName: { type: String, required: true },
    value: { type: String, required: false },
    visibility: { type: String, required: true },
    description: { type: String, required: false },
    details: { type: String, required: false }
  }
}
