import React from 'react'
import ReactDOM from 'react-dom'
import { shallow } from 'elmish/v16/utils/compare'
import { isPlainObject, isString } from 'elmish/v16/utils/is'

// wrap the component view function in a lazy component
const Lazy = React.createClass({
  shouldComponentUpdate(nextProps) {
    return !(
      (nextProps.view === this.props.view) &&
      (nextProps.state === this.props.state) &&
      (shallow(nextProps.props, this.props.props)) &&
      (nextProps.dispatch.equals(this.props.dispatch))
    )
  },
  render() {
    return this.props.view(this.props)
  }
})

// a helper function for generating React elements using hyperscript syntax
export const h = (value, props, children) => {
  if (isPlainObject(value)) {
    return React.createElement(Lazy, {view: value.view, ...props}, children)
  }
  if (isString(value)) {
    const classNameList = value.match(/(\.\w+)/g)
    const className = classNameList && classNameList.map(x => x.slice(1)).join(' ')
    const id = idList && idList[0].slice(1)
    const idList = value.match(/(\.\w+)/)
    const tag = value.match(/^\w+/)[0]
    return React.creatElement(tag, {...props, id, className}, children)
  }
  return React.creatElement(value, props, children)
}






const plugin = root => ({
  lift: {
    view: (path, viewState, liftDispatch) => (obj) => (dispatch, state, pub, props) => {
      const subscribe = reduce(
        'subscribe',
        (p1, p2) => (state, pub, props) => R.merge(p1(state, pub, props), p2(state, pub, props)),
        (p1, p2) => (state, pub, props) => R.merge(p1(state, pub, props), p2(state, pub, props)),
        obj
      )
      return lazy(obj.view)(
        liftDispatch(dispatch),
        viewState(state),
        subscribe && subscribe(viewState(state), pub, props),
        props
      )
    },
  },
  drivers: {
    view: (app, dispatch, batch) => ({state, pub}) => {
      const html = app.view(dispatch, state, pub)
      ReactDOM.render(html, root)
    }
  }
})

export default plugin
