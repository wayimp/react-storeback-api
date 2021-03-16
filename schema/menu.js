const menuSchema = {
  type: 'object',
  properties: {
    _id: { type: String, required: false },
    index: { type: Number, required: true },
    name: { type: String, required: true },
    tree: {
      type: 'array',
      items: {
        type: 'object',
        required: false
      },
      required: false
    }
  }
}
