import type { ReactElement } from 'react'
import {
  render as testingLibraryRender,
  type RenderOptions,
} from '@testing-library/react'
import { AppProviders } from '../app/AppProviders'

export function render(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return testingLibraryRender(ui, { wrapper: AppProviders, ...options })
}
