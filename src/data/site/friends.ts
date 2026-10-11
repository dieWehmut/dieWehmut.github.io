import type { FriendLink } from '../../types/content'

// The name on each card opens the friend's GitHub profile. `github` is only
// needed when the account cannot be inferred from `url` (`<login>.github.io`)
// or from the GitHub avatar URL — fill it in manually for those friends.
export const friends: FriendLink[] = [
  {
    id: 'linca',
    name: 'Linca',
    description: 'Zero Calorie Drink Shop',
    url: 'https://lhcfl.github.io/',
    avatar: 'https://avatars.githubusercontent.com/lhcfl',
  },
  {
    id: 'je1ghtxyun',
    name: 'Je1ghtxyuN',
    description: 'SEU CS',
    url: 'https://je1ght.top',
    github: 'https://github.com/Je1ghtxyuN',
    avatar: 'https://avatars.githubusercontent.com/Je1ghtxyuN',
  },
  {
    id: 'AkiMisaka',
    name: 'AkiMisaka',
    description: '不是糖猫',
    url: 'https://blog.1343263.xyz',
    github: 'https://github.com/asdetycv1zzc',
    avatar: 'https://avatars.githubusercontent.com/asdetycv1zzc',
  },
  {
    id: 'fugod',
    name: 'fugod',
    description: 'fufu142857',
    url: 'https://fufu142857.github.io/',
    avatar: 'https://avatars.githubusercontent.com/fufu142857',
  },
  {
    id: 'ken1301225',
    name: 'ken1301225',
    description: 'Focusing on bandit algorithms and LLM and VLA inference acceleration',
    url: 'https://ken1301225.github.io/',
    avatar: 'https://avatars.githubusercontent.com/ken1301225',
  },
  {
    id: 'shanmeng-chunyu',
    name: "山梦春雨",
    description: 'NJU 山梦春雨',
    url: 'https://shanmeng-chunyu.github.io/personal-homepage',
    avatar: 'https://avatars.githubusercontent.com/shanmeng-chunyu',
  },
  {
    id: 'Lilythos',
    name: "Lilythos",
    description: 'Think, Act, Reflect',
    url: 'https://lilythos.github.io/TD/',
    avatar: 'https://avatars.githubusercontent.com/lilythos',
  },
]
