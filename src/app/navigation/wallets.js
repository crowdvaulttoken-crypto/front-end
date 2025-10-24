import { WalletIcon,ArrowRightCircleIcon,BoltIcon } from "@heroicons/react/24/outline";

import { NAV_TYPE_ROOT, NAV_TYPE_ITEM } from 'constants/app.constant'

const ROOT_WALLET = '/wallets'

const path = (root, item) => `${root}${item}`;

export const wallets = {
    id: 'wallets',
    type: NAV_TYPE_ROOT,
    path: '/wallets',
    title: 'Wallets',
    transKey: 'Wallets',
    Icon: WalletIcon,
    childs: [
        {
            id: 'wallets.withdraw',
            path: path(ROOT_WALLET, '/withdraw'),
            type: NAV_TYPE_ITEM,
            title: 'Withdraw',
            transKey: 'Withdraw',
            Icon: BoltIcon,
        },
        {
            id: 'wallets.deposit',
            path: path(ROOT_WALLET, '/deposit'),
            type: NAV_TYPE_ITEM,
            title: 'deposit',
            transKey: 'Deposit',
            Icon: ArrowRightCircleIcon,
        },        

    ]
}
