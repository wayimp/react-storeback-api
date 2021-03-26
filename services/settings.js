const settingSchema = require('../schema/setting')
const moment = require('moment-timezone')
const dateFormat = 'YYYY-MM-DDTHH:mm:SS'
const { ObjectId } = require('mongodb')

const updateOne = {
  body: {
    settingSchema
  }
}

const deleteOne = {
  response: {
    200: {}
  }
}

const single = {
  schema: {
    response: {
      200: { settingSchema }
    }
  }
}

const multiple = {
  200: {
    description: 'settings',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        result: { settingSchema }
      }
    }
  }
}

async function routes (fastify, options) {
  const settingsCollection = fastify.mongo.db.collection('settings')
  const jwt = fastify.jwt

  fastify.patch('/settings', { schema: updateOne }, async function (
    request,
    reply
  ) {
    const { body } = request

    console.log(body)

    const id = body._id
    delete body._id

    const result = await settingsCollection.updateOne(
      {
        _id: ObjectId(id)
      },
      { $set: body },
      { upsert: true }
    )

    if (result.upsertedCount > 0) {
      body._id = result.upsertedId._id
    } else {
      body._id = id
    }

    return body
  })

  fastify.get('/settings/:names', multiple, async (request, reply) => {
    const { names } = request.params

    const arrayOfNames = names.split('~')

    const pipeline = [
      {
        $match: {
          name: {
            $in: arrayOfNames
          }
        }
      }
    ]

    const result = await settingsCollection.aggregate(pipeline).toArray()

    return result
  })

  fastify.delete(
    '/settings/:id',
    { schema: deleteOne },
    async (request, reply) => {
      const {
        params: { id }
      } = request
      const result = await settingsCollection.deleteOne({ _id: ObjectId(id) })
      return result
    }
  )

  fastify.get('/settings', multiple, async (request, reply) => {
    try {
      const settings = await settingsCollection
        .find({})
        .sort({ index: 1 })
        .toArray()

      return {
        title: 'Settings',
        slots: {
          heading: 'Welcome to Settings'
        },
        settings
      }
    } catch (err) {
      reply.send(err)
    }
  })

  fastify.post('/settings-order', {}, async function (request, reply) {
    const { body } = request

    const updates = []
    body.map(setting => {
      updates.push({
        updateOne: {
          filter: {
            _id: ObjectId(setting._id)
          },
          update: { $set: { index: setting.index } }
        }
      })
    })

    const result = await settingsCollection.bulkWrite(updates)
    const { insertedCount } = result

    return insertedCount
  })
}

module.exports = routes
