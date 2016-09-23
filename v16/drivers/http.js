import { computeEffect } from 'elmish/v16/elmish'
import { reduceLazyTree } from 'elmish/v16/lazy-tree'
import { effectEquals } from 'elmish/v16/utils/compare'
import R from 'ramda'

const combineFunctions = (a, b) => (...args) => {
  a(...args)
  b(...args)
}

const combineHttpEffects = (a, b) => {
  return {
    ...a,
    onSuccess: combineFunctions(a.onSuccess, b.onSuccess),
    onFailure: combineFunctions(a.onFailure, b.onFailure),
  }
}

const driver = (app, dispatch) => {

  let computation = undefined
  let inFlight = {}

  const sendRequest = (key, request) => {
    window.fetch(request.url, R.omit(['key', 'onSuccess', 'onFailure'], request))
    .then(response => {
      response.json().then(json => {
        response.json = json
        const handler = inFlight[key]
        if (handler) {
          handler.onSuccess(response)
        }
      })
    })
    .catch(error => {
      const handler = inFlight[key]
      if (handler) {
        handler.onFailure(error)
      }
    })
  }

  return state => {
    const computeHttp = computeEffect('http', app)
    const tree = computeHttp({state, dispatch})

    computation = reduceLazyTree(effectEquals, (a,b) => {
      return R.mergeWith(combineHttpEffects, a, b)
    }, undefined, tree)

    const requests = computation.result

    Object.keys(requests).forEach(key => {
      if (!inFlight[key]) {
        sendRequest(key, requests[key])
      }
      inFlight[key] = requests[key]
    })

    Object.keys(inFlight).forEach(key => {
      if (!requests[key]) {
        delete inFlight[key]
      }
    })
  }
}

export default driver
