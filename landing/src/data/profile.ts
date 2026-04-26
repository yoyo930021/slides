export interface Social {
  type: 'github' | 'email' | 'twitter' | 'other'
  label: string
  url: string
}

export interface Profile {
  name: string
  tagline: string
  bio: string
  avatar: string
  socials: Social[]
}

export const profile: Profile = {
  name: 'yoyo930021',
  tagline: '個人演講與分享集中地',
  bio: '在這裡蒐集我做過的技術演講。歡迎自取講義；簡報使用 Slidev 製作。',
  avatar: '',
  socials: [
    { type: 'github', label: 'GitHub', url: 'https://github.com/yoyo930021' },
    { type: 'email', label: 'Email', url: 'mailto:yoyo930021@gmail.com' },
  ],
}
