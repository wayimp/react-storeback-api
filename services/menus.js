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
  const settingsCollection = fastify.mongo.db.collection('settings')
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
    } else {
      body._id = id
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

      const settings = await settingsCollection
        .find({
          name: {
            $in: ['menu_tabs', 'menu_hamburger']
          }
        })
        .toArray()

      return {
        title: 'Menus',
        slots: {
          heading: 'Welcome to Menus'
        },
        menus,
        settings
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

  const fillTree = tree => {
    return tree.map(branch => {
      branch.text = branch.title
      branch.as = branch.title
      branch.href = branch.title

      if (branch.children) {
        branch.items = fillTree(branch.children)
      } else {
        branch.expanded = false
      }

      return branch
    })
  }

  fastify.get('/appData', async (request, reply) => {
    try {
      const settings_pipeline = [
        {
          $match: {
            name: {
              $in: ['menu_hamburger', 'menu_tabs']
            }
          }
        }
      ]

      const settings = await settingsCollection
        .aggregate(settings_pipeline)
        .toArray()

      const menu_hamburger_setting = settings.find(
        menu => menu.name == 'menu_hamburger'
      )
      const menu_tabs_setting = settings.find(menu => menu.name == 'menu_tabs')

      const menus_pipeline = [
        {
          $match: {
            _id: {
              $in: settings.map(setting => ObjectId(setting.value))
            }
          }
        }
      ]

      const menus = await menusCollection.aggregate(menus_pipeline).toArray()

      const hamburger_menu = menus.find(
        menu => menu._id == menu_hamburger_setting.value
      )
      const tabs_menu = menus.find(menu => menu._id == menu_tabs_setting.value)

      const menuItems = fillTree(hamburger_menu.tree)
      const tabs = fillTree(tabs_menu.tree)

      return { menu: { items: menuItems }, tabs }
    } catch (err) {
      reply.send(err)
    }
  })
}

module.exports = routes
