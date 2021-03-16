const menuSchema = require('../schema/menu')
const moment = require('moment-timezone')
const dateFormat = 'YYYY-MM-DDTHH:mm:SS'
const { ObjectId } = require('mongodb')

const updateOne = {
  body: {
    menuSchema
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
      200: { menuSchema }
    }
  }
}

const multiple = {
  200: {
    description: 'menus',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        result: { menuSchema }
      }
    }
  }
}

async function routes (fastify, options) {
  const menusCollection = fastify.mongo.db.collection('menus')
  const jwt = fastify.jwt

  fastify.patch('/menus', { schema: updateOne }, async function (
    request,
    reply
  ) {
    const { body } = request
    const id = body._id
    delete body._id

    const result = await menusCollection.updateOne(
      {
        _id: ObjectId(id)
      },
      { $set: body },
      { upsert: true }
    )

    if (result.upsertedCount > 0) {
      body._id = result.upsertedId._id
    }

    return body
  })

  fastify.get('/menus/:id', multiple, async (request, reply) => {
    const result = await menusCollection.findOne({
      _id: ObjectId(request.params.id)
    })

    if (!result) {
      const err = new Error()
      err.statusCode = 400
      err.message = `id: ${id}.`
      throw err
    }

    return result
  })

  fastify.delete(
    '/menus/:id',
    { schema: deleteOne },
    async (request, reply) => {
      const {
        params: { id }
      } = request
      const result = await menusCollection.deleteOne({ _id: ObjectId(id) })
      return result
    }
  )

  fastify.get('/menus', multiple, async (request, reply) => {
    try {
      const menus = await menusCollection
        .find({})
        .sort({ index: 1 })
        .toArray()

      return {
        title: 'Menus',
        slots: {
          heading: 'Welcome to Menus'
        },
        menus
      }
    } catch (err) {
      reply.send(err)
    }
  })

  fastify.post('/menus-order', {}, async function (request, reply) {
    const { body } = request

    const updates = []
    body.map(menu => {
      updates.push({
        updateOne: {
          filter: {
            _id: ObjectId(menu._id)
          },
          update: { $set: { index: menu.index } }
        }
      })
    })

    const result = await menusCollection.bulkWrite(updates)
    const { insertedCount } = result

    return insertedCount
  })
}

module.exports = routes
