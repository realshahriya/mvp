import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { bscTestnet } from 'viem/chains'
import { QueryClient } from '@tanstack/react-query'

export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || '00000000-0000-0000-0000-000000000000'

export const wagmiAdapter = new WagmiAdapter({
    projectId,
    networks: [bscTestnet]
})

export const queryClient = new QueryClient()

export const appKit = createAppKit({
    adapters: [wagmiAdapter],
    networks: [bscTestnet],
    projectId,
    metadata: {
        name: 'CENCERA',
        description: 'Trust is in your hands. First Trust Score Analysis Platform on WEB3',
        url: typeof window !== 'undefined' ? window.location.origin : '',
        icons: ['/logo.png']
    },
    themeMode: 'dark',
    features: {
        connectMethodsOrder: ["wallet"],
        analytics: false,
        swaps: false,
        send: false,
        history: false,
    }
})
