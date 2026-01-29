import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, parseEther, parseUnits } from 'viem';
import type { Chain } from 'viem';
import { mainnet, arbitrum, optimism, base, bsc, polygon, avalanche, fantom } from 'viem/chains';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const CHAINS: Record<string, Chain> = {
  '1': mainnet,
  '42161': arbitrum,
  '10': optimism,
  '8453': base,
  '56': bsc,
  '137': polygon,
  '43114': avalanche,
  '250': fantom,
};

const ERC20_ABI = [
  { inputs: [], name: 'name', outputs: [{ type: 'string' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'symbol', outputs: [{ type: 'string' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'decimals', outputs: [{ type: 'uint8' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ type: 'address' }, { type: 'uint256' }], name: 'transfer', outputs: [{ type: 'bool' }], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ type: 'address' }, { type: 'uint256' }], name: 'approve', outputs: [{ type: 'bool' }], stateMutability: 'nonpayable', type: 'function' },
] as const;

function getClient(chainId: string) {
  const chain = CHAINS[chainId] || mainnet;
  return createPublicClient({ chain, transport: http() });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      chainId = '1',
      action = 'native_transfer',
      from,
      to,
      value, // string in ether
      token, // erc20 address
      amount, // string in token units (human)
      abi, // optional custom ABI
      functionName, // optional function name
      args = [], // optional args
    } = body || {};

    const client = getClient(chainId);
    const ephemeral = ('0x0000000000000000000000000000000000000001') as `0x${string}`;
    const account = (from as `0x${string}`) || ephemeral;

    if (action === 'native_transfer') {
      if (!from || !to || !value) {
        // Allow dry-run even if params missing by using ephemerals with zero value
        if (!to) {
          return NextResponse.json({ error: 'missing_params' }, { status: 400 });
        }
      }
      let gasNum = 21000;
      try {
        const gas = await client.estimateGas({
          account,
          to: to as `0x${string}`,
          value: parseEther(String(value ?? '0')),
        });
        gasNum = Number(gas);
      } catch { /* fallback to 21k */ }
      const callRes = await client.call({
        account,
        to: to as `0x${string}`,
        value: parseEther(String(value ?? '0')),
      }).catch(() => null);
      return NextResponse.json({
        ok: true,
        gasUsed: gasNum,
        gasLimit: gasNum,
        success: !!callRes,
        logs: [],
        stateChanges: [
          { asset: 'Native', from: account, to, amount: String(value ?? '0') },
        ],
      });
    }

    if (action === 'erc20_transfer') {
      if (!from || !to || !token || !amount) {
        return NextResponse.json({ error: 'missing_params' }, { status: 400 });
      }
      const code = await client.getBytecode({ address: token as `0x${string}` }).catch(() => undefined);
      if (!code || code === '0x') {
        return NextResponse.json({ ok: false, success: false, error: 'not_contract' });
      }
      const decimals = await client.readContract({
        address: token as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'decimals',
      }).catch(() => 18);
      const amt = parseUnits(String(amount), Number(decimals));
      const sim = await client.simulateContract({
        account,
        address: token as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [to as `0x${string}`, amt],
      });
      return NextResponse.json({
        ok: true,
        gasUsed: sim.request.gas !== undefined ? Number(sim.request.gas) : 0,
        gasLimit: sim.request.gas !== undefined ? Number(sim.request.gas) : 0,
        success: true,
        logs: [],
        stateChanges: [
          { asset: 'ERC20', from: account, to, amount },
        ],
      });
    }

    if (action === 'erc20_approve') {
      if (!from || !to || !token || !amount) {
        return NextResponse.json({ error: 'missing_params' }, { status: 400 });
      }
      const code = await client.getBytecode({ address: token as `0x${string}` }).catch(() => undefined);
      if (!code || code === '0x') {
        return NextResponse.json({ ok: false, success: false, error: 'not_contract' });
      }
      const decimals = await client.readContract({
        address: token as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'decimals',
      }).catch(() => 18);
      const amt = parseUnits(String(amount), Number(decimals));
      const sim = await client.simulateContract({
        account,
        address: token as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [to as `0x${string}`, amt],
      });
      return NextResponse.json({
        ok: true,
        gasUsed: sim.request.gas !== undefined ? Number(sim.request.gas) : 0,
        gasLimit: sim.request.gas !== undefined ? Number(sim.request.gas) : 0,
        success: true,
        logs: [],
      });
    }

    if (action === 'contract_call') {
      if (!from || !abi || !functionName) {
        return NextResponse.json({ error: 'missing_params' }, { status: 400 });
      }
      const address = body.address as `0x${string}`;
      const parsedAbi = typeof abi === 'string' ? JSON.parse(abi) : abi;
      const sim = await client.simulateContract({
        account,
        address,
        abi: parsedAbi,
        functionName,
        args,
      });
      return NextResponse.json({
        ok: true,
        gasUsed: sim.request.gas !== undefined ? Number(sim.request.gas) : 0,
        gasLimit: sim.request.gas !== undefined ? Number(sim.request.gas) : 0,
        success: true,
        result: sim.result,
      });
    }

    // Quick actions with no inputs
    if (action === 'quick_native') {
      const toAddr = (to as `0x${string}`);
      let gasNum = 21000;
      try {
        const gas = await client.estimateGas({ account, to: toAddr, value: parseEther('0') });
        gasNum = Number(gas);
      } catch {}
      const callRes = await client.call({ account, to: toAddr, value: parseEther('0') }).catch(() => null);
      return NextResponse.json({
        ok: true,
        gasUsed: gasNum,
        gasLimit: gasNum,
        success: !!callRes,
        stateChanges: [{ asset: 'Native', from: account, to: toAddr, amount: '0' }],
        logs: [],
      });
    }

    if (action === 'quick_erc20_transfer') {
      const tokenAddr = token as `0x${string}`;
      const toAddr = (to as `0x${string}`) || ephemeral;
      const code = await client.getBytecode({ address: tokenAddr }).catch(() => undefined);
      if (!code || code === '0x') {
        return NextResponse.json({ ok: false, success: false, error: 'not_contract' });
      }
      const decimals = await client.readContract({ address: tokenAddr, abi: ERC20_ABI, functionName: 'decimals' }).catch(() => 18);
      const amt = parseUnits('1', Number(decimals));
      const sim = await client.simulateContract({
        account,
        address: tokenAddr,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [toAddr, amt],
      }).catch(() => null);
      const ok = !!sim;
      const gas = ok ? (sim!.request.gas !== undefined ? Number(sim!.request.gas) : 0) : 0;
      return NextResponse.json({
        ok,
        gasUsed: gas,
        gasLimit: gas,
        success: ok,
        stateChanges: [{ asset: 'ERC20', from: account, to: toAddr, amount: '1' }],
        logs: [],
      });
    }

    if (action === 'quick_erc20_approve') {
      const tokenAddr = token as `0x${string}`;
      const toAddr = (to as `0x${string}`) || ephemeral;
      const code = await client.getBytecode({ address: tokenAddr }).catch(() => undefined);
      if (!code || code === '0x') {
        return NextResponse.json({ ok: false, success: false, error: 'not_contract' });
      }
      const decimals = await client.readContract({ address: tokenAddr, abi: ERC20_ABI, functionName: 'decimals' }).catch(() => 18);
      const amt = parseUnits('1', Number(decimals));
      const sim = await client.simulateContract({
        account,
        address: tokenAddr,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [toAddr, amt],
      }).catch(() => null);
      const ok = !!sim;
      const gas = ok ? (sim!.request.gas !== undefined ? Number(sim!.request.gas) : 0) : 0;
      return NextResponse.json({
        ok,
        gasUsed: gas,
        gasLimit: gas,
        success: ok,
        logs: [],
      });
    }

    if (action === 'quick_proxy') {
      const address = body.address as `0x${string}`;
      const code = await client.getBytecode({ address }).catch(() => undefined);
      const slot = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc' as `0x${string}`;
      const implRaw = await client.getStorageAt({ address, slot }).catch(() => null);
      let implementation: string | null = null;
      if (implRaw && implRaw !== '0x' && implRaw.length >= 66) {
        implementation = (`0x${implRaw.slice(-40)}`) as `0x${string}`;
      }
      const proxy = !!implementation && !!code;
      return NextResponse.json({
        ok: true,
        success: true,
        gasUsed: 0,
        gasLimit: 0,
        logs: [],
        result: { proxy, implementation },
      });
    }

    if (action === 'quick_paused') {
      const address = body.address as `0x${string}`;
      const PAUSED_ABI = [{ inputs: [], name: 'paused', outputs: [{ type: 'bool' }], stateMutability: 'view', type: 'function' }] as const;
      const paused = await client.readContract({ address, abi: PAUSED_ABI, functionName: 'paused' }).catch(() => null);
      return NextResponse.json({
        ok: true,
        success: true,
        gasUsed: 0,
        gasLimit: 0,
        logs: [],
        result: { paused },
      });
    }

    return NextResponse.json({ error: 'unsupported_action' }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'simulate_failed', details: msg }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
