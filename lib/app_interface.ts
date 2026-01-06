
export interface Tag {
  name?: string
  sort?: number
  child?: Tag[]
}

export interface Category {
  id: string
  name: string
  display_name: string
  parent_id: number | null
  icon_url?: string
  mode_id?: string
  tags?:Tag[] 
  children?: Category[]
}