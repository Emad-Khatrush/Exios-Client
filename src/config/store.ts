import { configureStore } from '@reduxjs/toolkit'
import { session } from '../reducers/session'

export default configureStore({
    reducer: {
      session
    }
})
