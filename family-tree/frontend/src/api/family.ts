import http from './http'

export interface FamilyMember {
  id: number
  name: string
  gender: number
  birthYear: number | null
  deathYear: number | null
  generation: number | null
  avatarUrl: string | null
  bio: string | null
}

export interface FamilyRelationship {
  id: number
  memberAId: number
  memberBId: number
  relationType: string
}

export interface FamilyStory {
  id: number
  memberId: number
  title: string
  content: string | null
  storyYear: number | null
  storyMonth: number | null
  category: string | null
  status: number
  submitterName: string
  reviewerId: number | null
  reviewComment: string | null
}

export interface FamilyTreeData {
  members: FamilyMember[]
  relationships: FamilyRelationship[]
}

export interface MemberDetail {
  member: FamilyMember
  relationships: FamilyRelationship[]
  stories: FamilyStory[]
}

// 匿名接口
export function getFamilyTree() {
  return http.get<{ code: number; data: FamilyTreeData }>('/family/tree')
}

export function getMemberDetail(id: number, submitterName?: string) {
  return http.get<{ code: number; data: MemberDetail }>(`/family/member/${id}`, {
    params: submitterName ? { submitterName } : undefined
  })
}

export function getMemberStories(id: number, submitterName?: string) {
  return http.get<{ code: number; data: FamilyStory[] }>(`/family/member/${id}/stories`, {
    params: submitterName ? { submitterName } : undefined
  })
}

export function getAllStories() {
  return http.get<{ code: number; data: FamilyStory[] }>('/family/stories')
}

export function submitStory(data: {
  memberId: number
  title: string
  content?: string
  storyYear?: number
  storyMonth?: number
  category?: string
  submitterName: string
}) {
  return http.post<{ code: number; message: string }>('/family/story/submit', data)
}

// 管理接口
export function adminLogin(username: string, password: string) {
  return http.post<{ code: number; data: { token: string; username: string } }>(
    '/admin/family/login',
    { username, password }
  )
}

export function getMembers() {
  return http.get<{ code: number; data: FamilyMember[] }>('/admin/family/members')
}

export function addMember(data: Partial<FamilyMember>) {
  return http.post<{ code: number }>('/admin/family/member', data)
}

export function updateMember(id: number, data: Partial<FamilyMember>) {
  return http.put<{ code: number }>(`/admin/family/member/${id}`, data)
}

export function deleteMember(id: number) {
  return http.delete<{ code: number }>(`/admin/family/member/${id}`)
}

export function addRelationship(data: { memberAId: number; memberBId: number; relationType: string }) {
  return http.post<{ code: number }>('/admin/family/relationship', data)
}

export function deleteRelationship(id: number) {
  return http.delete<{ code: number }>(`/admin/family/relationship/${id}`)
}

export function getPendingStories() {
  return http.get<{ code: number; data: FamilyStory[] }>('/admin/family/stories/pending')
}

export function reviewStory(id: number, status: number, reviewComment?: string) {
  return http.put<{ code: number }>(`/admin/family/story/${id}/review`, { status, reviewComment })
}

export function addRelative(memberId: number, data: {
  relationType: string
  name: string
  birthYear?: number
  deathYear?: number
}) {
  return http.post<{ code: number }>(`/admin/family/member/${memberId}/relative`, data)
}

// 统计
export interface FamilyStats {
  totalMembers: number
  maleCount: number
  femaleCount: number
  unknownGenderCount: number
  minGeneration: number | null
  maxGeneration: number | null
}

export function getStats() {
  return http.get<{ code: number; data: FamilyStats }>('/family/stats')
}

// 头像上传
export function uploadAvatar(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return http.post<{ code: number; data: { url: string } }>('/admin/upload/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// 回收站
export function getDeletedMembers() {
  return http.get<{ code: number; data: FamilyMember[] }>('/admin/family/members/deleted')
}

export function restoreMember(id: number) {
  return http.put<{ code: number }>(`/admin/family/member/${id}/restore`)
}

export function permanentlyDeleteMember(id: number) {
  return http.delete<{ code: number }>(`/admin/family/member/${id}/permanent`)
}
