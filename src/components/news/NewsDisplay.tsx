import { NewsItem } from '@/types'

interface NewsDisplayProps {
  news: NewsItem[]
  newsError: string
  activeNewsIndex: number
  onRefreshNews: () => void
}

export function NewsDisplay({ news, newsError, activeNewsIndex, onRefreshNews }: NewsDisplayProps) {
  if (newsError) {
    return (
      <div className="error">
        <div>{newsError}</div>
        <button className="refresh-btn" onClick={onRefreshNews}>
          Refresh News
        </button>
      </div>
    )
  }

  if (news.length === 0) {
    return <div className="loading">Loading BBC News</div>
  }

  return (
    <>
      {news.map((item: NewsItem, index: number) => (
        <div 
          key={index}
          className={`news-item ${index === activeNewsIndex ? 'active' : ''}`}
        >
          {item.thumbnailUrl && (
            <img
              src={item.thumbnailUrl}
              className="news-thumbnail"
              alt={item.title}
            />
          )}
          <h3>{item.title}</h3>
          <p>{item.description}</p>
          <div className="news-meta">
            <span>BBC News</span>
            <span>{item.date}</span>
          </div>
        </div>
      ))}
    </>
  )
}