import { TrophyIcon,UsersIcon,ChartBarIcon,ArrowsRightLeftIcon } from "@heroicons/react/24/outline";

import { NAV_TYPE_ROOT, NAV_TYPE_ITEM } from 'constants/app.constant'

const ROOT_REWARDS = '/rewards'

const path = (root, item) => `${root}${item}`;

export const rewards = {
    id: 'rewards',
    type: NAV_TYPE_ROOT,
    path: '/rewards',
    title: 'Rewards',
    transKey: 'Rewards',
    Icon: TrophyIcon,
    childs: [
        {
            id: 'rewards.referral',
            path: path(ROOT_REWARDS, '/referral'),
            type: NAV_TYPE_ITEM,
            title: 'Referral',
            transKey: 'Referral',
            Icon: UsersIcon,
        },
        {
            id: 'rewards.royalty',
            path: path(ROOT_REWARDS, '/royalty'),
            type: NAV_TYPE_ITEM,
            title: 'Royalty',
            transKey: 'Royalty',
            Icon: ChartBarIcon,
        },
        {
            id: 'rewards.passive',
            path: path(ROOT_REWARDS, '/passive'),
            type: NAV_TYPE_ITEM,
            title: 'passive',
            transKey: 'Passive',
            Icon: ArrowsRightLeftIcon,
        },        

    ]
}
