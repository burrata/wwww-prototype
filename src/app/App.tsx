import { BoardPage } from './pages/BoardPage'
import { SemesterListPage } from './pages/SemesterListPage'
import { SemesterPage } from './pages/SemesterPage'
import { StorageErrorPage } from './pages/StorageErrorPage'
import { AppFrame } from './components/AppFrame'
import { useRoute } from './routing'
import { useDocumentStore } from './use-document-store'
import { createLocalDocumentStorage, type DocumentStorage } from '../storage/local-storage'

type AppProps = { storage?: DocumentStorage }

export function App({ storage = createLocalDocumentStorage(window.localStorage) }: AppProps) {
  const route = useRoute()
  const store = useDocumentStore(storage)

  if (store.loadResult.status === 'invalid') {
    return (
      <AppFrame message={store.message}>
        <StorageErrorPage message={store.loadResult.message} onDiscard={store.discardInvalidData} />
      </AppFrame>
    )
  }

  let page
  if (route.page === 'semester') {
    page = <SemesterPage document={store.document} semesterId={route.semesterId} commit={store.commit} />
  } else if (route.page === 'board') {
    page = <BoardPage document={store.document} boardId={route.boardId} />
  } else {
    page = <SemesterListPage document={store.document} commit={store.commit} />
  }

  return <AppFrame message={store.message}>{page}</AppFrame>
}
