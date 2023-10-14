import {
  Connection,
  Keypair,
  Signer,
  PublicKey,
  Transaction,
  TransactionSignature,
  ConfirmOptions,
  sendAndConfirmRawTransaction,
  RpcResponseAndContext,
  SimulatedTransactionResponse,
  Commitment,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import * as bs58 from 'bs58'
import * as splToken from '@solana/spl-token'
import fs from 'fs'
import * as anchor from '@project-serum/anchor'
import * as pool_api from './pool_api'

const sleep = (ms : number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

async function airdrop(conn : Connection, address : PublicKey){
  let hash = await conn.requestAirdrop(address, LAMPORTS_PER_SOL)
  await conn.confirmTransaction(hash)
  await sleep(10000)
}

async function displayStates(conn : Connection,addresses : PublicKey[]){
    for(let i=0; i<addresses.length; i++){
        let amount = (await conn.getTokenAccountBalance(addresses[i])).value.amount
        console.log(addresses[i].toBase58() + " : " + amount);
    }
}

async function test() {
    console.log("You are clever")
    let conn = new Connection("https://api.devnet.solana.com",'confirmed')
//    let creator = Keypair.fromSecretKey(bs58.decode("2pUVo4mVSnebLyLmMTHgPRNbk7rgZki77bsYgbsuuQX9585N4aKNXWJRpyc98qnpgRKRH2hzB8VVnqeffurW39F4"))
    let creator = Keypair.fromSecretKey(Uint8Array.from([
        176, 135, 146,  49,  40, 213,  19, 242, 253,  61,  13,
        211,  58, 109, 250, 196, 241,  70, 221,  40,   8, 158,
        137,  85, 135, 182, 250, 163, 233, 138, 178,  66, 130,
         75,  49, 136,  93,  22, 119, 225,  93, 220, 201,  75,
         70, 243,  61,  40, 175, 102,  64, 235, 210, 210, 130,
         99,  38, 109, 161,   7, 200, 204,  82, 141
      ]))
    console.log(creator.publicKey.toBase58())
    let bidder = Keypair.fromSecretKey(bs58.decode("4Xhsf3HVrNPrniTGPGqFUEkJMi976pogAUoFnXMg9ztQu8ejHUBXeGENRAj7fQe2z8TKm6mBmCwXKB3VgLFvY6pC"))
    let pool = Keypair.generate()  
    let tokenMint = await splToken.Token.createMint(conn,creator,creator.publicKey,null,9,splToken.TOKEN_PROGRAM_ID)
    let creator_token = await tokenMint.createAccount(creator.publicKey)
    let bidder_token = await tokenMint.createAccount(bidder.publicKey)
    await tokenMint.mintTo(creator_token,creator,[],1000)
    await tokenMint.mintTo(bidder_token,creator,[],1000)

    await pool_api.initPool(
        conn,creator,pool,tokenMint.publicKey,
    )
    await pool_api.setWhitelist(
        conn,pool.publicKey,creator,bidder.publicKey,10,true,
    )
    // await pool_api.setWhitelist(
    //     conn,pool.publicKey,creator,creator.publicKey,10,true,
    // )
    // await pool_api.updateWhitelist(
    //     conn,pool.publicKey,creator,bidder.publicKey,
    // )
    await pool_api.controlPresaleLive(
        conn,pool.publicKey,creator,true,
    )

    let nft_mint = await splToken.Token.createMint(conn,creator,creator.publicKey,null,0,splToken.TOKEN_PROGRAM_ID);
    let nft_seller_account = await nft_mint.createAccount(creator.publicKey);
    let metadata = {
        name : 'HvH C and I Soldiers #20000',
        symbol : 'HvHCIS',
        uri : 'https://arweave.net/FRIyuuS61PJKTavtxtcKIDGZus9_ZqiikCAdfDkTEpo',
        sellerFeeBasis_points : 1000, //3% (0 - 10000)
        creators : [
            {address: creator.publicKey, verified:false, share:100}
        ],
        isMutable : true,
    }
    await pool_api.mintNft(
        conn,creator,pool.publicKey,nft_mint.publicKey,nft_seller_account,metadata,
    )
    // await pool_api.setMaxPrice(
    //     conn,creator,pool.publicKey,nft_mint.publicKey,300,
    // )
    // await pool_api.initSaleManager(
    //     conn,creator,pool.publicKey,nft_mint.publicKey,
    // )
    // let sale_manager = (await PublicKey.findProgramAddress([pool.publicKey.toBuffer(),nft_mint.publicKey.toBuffer()],pool_api.programId))[0]
    // let nft_manager_account = await nft_mint.createAccount(sale_manager)
    // let manager_pot = await tokenMint.createAccount(sale_manager)
    // await pool_api.sellNft(
    //     conn,creator,pool.publicKey,nft_mint.publicKey,nft_seller_account,nft_manager_account,manager_pot,100,
    // )

    // let nft_bidder_account = await nft_mint.createAccount(bidder.publicKey)
    // await pool_api.buyNft(
    //     conn,bidder,pool.publicKey,nft_mint.publicKey,nft_bidder_account,bidder_token,
    // )
    // await pool_api.redeemNft(
    //     conn,creator,pool.publicKey,nft_mint.publicKey,nft_seller_account
    // )
    // await pool_api.withdrawFund(
    //     conn,creator,sale_manager,creator_token,
    // )
    await displayStates(conn,[creator_token,bidder_token])
}

test()
