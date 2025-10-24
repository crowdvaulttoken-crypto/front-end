import { NAV_TYPE_ITEM, } from "constants/app.constant";
import DashboardsIcon from 'assets/dualicons/dashboards.svg?react'
import { WalletIcon,TrophyIcon } from "@heroicons/react/24/outline";

export const baseNavigation = [
    {
        id: 'dashboards',
        type: NAV_TYPE_ITEM,
        path: '/dashboards',
        title: 'Dashboards',
        transKey: 'nav.dashboards.dashboards',
        Icon: DashboardsIcon,
    },
    {
        id: 'wallets',
        type: NAV_TYPE_ITEM,
        path: '/wallets',
        title: 'Wallet',
        transKey: 'Wallet',
        Icon: WalletIcon,
    },
    {
        id: 'rewards',
        type: NAV_TYPE_ITEM,
        path: '/rewards',
        title: 'Rewards',
        transKey: 'Rewards',
        Icon: TrophyIcon,
    },
]
