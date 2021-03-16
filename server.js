const fastify = require('fastify')({
  ignoreTrailingSlash: true,
  pluginTimeout:0,
  logger: true
})

const helmet = require('fastify-helmet')
const auth = require('fastify-auth')
const jwt = require('fastify-jwt')

fastify.register(helmet)
fastify.register(auth)
fastify.register(jwt, { secret: 'JauLnD7PhEpvfGOQrZJq' })
fastify.register(require('fastify-cors'), { 
  // put your options here
})
fastify.register(require('./mongodb'))
fastify.register(require('./services/users'))
fastify.register(require('./services/menus'))

//fastify.register(require('./plugins/authenticate'))

//fastify.decorate('verifyJWT', verifyJWT)
//fastify.decorate('verifyUser', verifyUser)

/*
fastify.addHook("onRequest", async (request, reply) => {
  try {
    await request.jwtVerify()
  } catch (err) {
    reply.send(err)
  }
})
*/


const start = async () => {
  try {
    await fastify.listen(3030, '0.0.0.0')
    fastify.log.info(`server listening on ${fastify.server.address().port}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()
