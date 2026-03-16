import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { authService } from '../../services/api/auth.service'
import { STORAGE_KEYS } from '../../utils/constants'
import type { UserRole } from '../../utils/constants'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
}

interface AuthState {
  user: AuthUser | null
  token: string | null
  refreshToken: string | null
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
}

const AUTH_STORAGE_KEY = STORAGE_KEYS.AUTH

function loadInitialState(): AuthState {
  if (typeof window === 'undefined') {
    return {
      user: null,
      token: null,
      refreshToken: null,
      status: 'idle',
      error: null,
    }
  }

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) {
      return {
        user: null,
        token: null,
        refreshToken: null,
        status: 'idle',
        error: null,
      }
    }
    const parsed = JSON.parse(raw) as Pick<AuthState, 'user' | 'token' | 'refreshToken'>
    return {
      user: parsed.user ?? null,
      token: parsed.token ?? null,
      refreshToken: parsed.refreshToken ?? null,
      status: parsed.token ? 'succeeded' : 'idle',
      error: null,
    }
  } catch {
    return {
      user: null,
      token: null,
      refreshToken: null,
      status: 'idle',
      error: null,
    }
  }
}

const initialState: AuthState = loadInitialState()


export const login = createAsyncThunk<
  { user: AuthUser; token: string; refreshToken: string },
  { email: string; password: string },
  { rejectValue: string }
>('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const response = await authService.login(credentials)
    return response
  } catch (err: any) {
    const message = err.message || 'Login failed'
    return rejectWithValue(message)
  }
})

export const signup = createAsyncThunk<
  { user: AuthUser; token: string; refreshToken: string },
  { name: string; email: string; password: string; role: UserRole },
  { rejectValue: string }
>('auth/signup', async (credentials, { rejectWithValue }) => {
  try {
    const response = await authService.signup(credentials)
    return response
  } catch (err: any) {
    const message = err.message || 'Signup failed'
    return rejectWithValue(message)
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null
      state.token = null
      state.refreshToken = null
      state.status = 'idle'
      state.error = null
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(AUTH_STORAGE_KEY)
      }
    },
    setTokens(
      state,
      action: PayloadAction<{ token: string; refreshToken: string; user?: AuthUser | null }>,
    ) {
      if (action.payload.user) {
        state.user = action.payload.user
      }
      state.token = action.payload.token
      state.refreshToken = action.payload.refreshToken

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(
          AUTH_STORAGE_KEY,
          JSON.stringify({ user: state.user, token: state.token, refreshToken: state.refreshToken }),
        )
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(
        login.fulfilled,
        (state, action: PayloadAction<{ user: AuthUser; token: string; refreshToken: string }>) => {
          state.status = 'succeeded'
          state.user = action.payload.user
          state.token = action.payload.token
          state.refreshToken = action.payload.refreshToken

          if (typeof window !== 'undefined') {
            window.localStorage.setItem(
              AUTH_STORAGE_KEY,
              JSON.stringify({
                user: state.user,
                token: state.token,
                refreshToken: state.refreshToken,
              }),
            )
          }
        },
      )
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload ?? 'Login failed'
      })
      .addCase(signup.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(
        signup.fulfilled,
        (state, action: PayloadAction<{ user: AuthUser; token: string; refreshToken: string }>) => {
          state.status = 'succeeded'
          state.user = action.payload.user
          state.token = action.payload.token
          state.refreshToken = action.payload.refreshToken

          if (typeof window !== 'undefined') {
            window.localStorage.setItem(
              AUTH_STORAGE_KEY,
              JSON.stringify({
                user: state.user,
                token: state.token,
                refreshToken: state.refreshToken,
              }),
            )
          }
        },
      )
      .addCase(signup.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload ?? 'Signup failed'
      })
  },
})

export const { logout, setTokens } = authSlice.actions
export default authSlice.reducer

