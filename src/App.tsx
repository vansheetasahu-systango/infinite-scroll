import React from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useVirtualizer } from '@tanstack/react-virtual'
import axios from 'axios'

// Fetch function to get paginated data
async function fetchServerPage(
  limit: number,
  offset: number = 0,
): Promise<{ rows: Array<{ name: string; id: string }>; nextOffset: number }> {
  const response = await axios.get(
    `https://6787e220c4a42c9161089db1.mockapi.io/items?limit=${limit}&page=${offset}`
  )
  const rows = response.data
  const nextOffset = offset + 1
  return { rows, nextOffset }
}

const App = () => {
  const {
    status,
    data,
    error,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ['items'],
    queryFn: (ctx) => fetchServerPage(10, ctx.pageParam || 0),  
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    initialPageParam: 0,
  })

  const allRows = data ? data.pages.flatMap((page) => page.rows) : []

  const parentRef = React.useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? allRows.length + 1 : allRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,  
    overscan: 5,  
  })

  // Trigger next page loading when we reach the bottom
  React.useEffect(() => {
    const [lastItem] = rowVirtualizer.getVirtualItems().reverse()
    if (lastItem && lastItem.index >= allRows.length - 1 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [allRows.length, hasNextPage, fetchNextPage, isFetchingNextPage])

  return (
    <div>
      <h1>Infinite Scroll </h1>
      <div ref={parentRef} className="List" style={{ height: '400px', overflowY: 'auto' }}>
        {status === 'pending' ? (
          <div className="Loading">Loading...</div>
        ) : status === 'error' ? (
          <div className="Loading">Error: {error.message}</div>
        ) : (
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const isLoaderRow = virtualRow.index >= allRows.length
              const post = allRows[virtualRow.index]

              return (
                <div
                  key={virtualRow.index}
                  className={`ListItem ${virtualRow.index % 2 === 0 ? 'ListItemEven' : 'ListItemOdd'}`}
                  style={{
                    position: 'absolute',
                    top: `${virtualRow.start}px`,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {isLoaderRow ? (
                    <div>Loading more...</div>
                  ) : (
                    <div>{post.name}</div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
