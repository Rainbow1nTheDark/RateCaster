import { Button, Frog, TextInput } from 'frog'
import { devtools } from 'frog/dev'
import { serveStatic } from '@hono/node-server/serve-static'
import DappRatingSystemABI from '../public/abi/DappRatingSystem.json'
import {
  DappRegistered,
  fetchDappRatings,
  fetchGraphQLRegisteredDapps,
} from "./graphQL/fetchFromSubgraph";
import { RatingsMap, computeAverageRatings, getRandomApps, truncateText } from './utils/helpers'
import { BytesLike } from 'ethers';


// *********** Helpers ************* //
const generateStars = (rating: number) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {[...Array(fullStars)].map((_, i) => (
        <span key={i} style={{ color: '#FFD700' }}>★</span>
      ))}
      {halfStar && <span style={{ color: '#FFD700' }}>★</span>}
      {[...Array(emptyStars)].map((_, i) => (
        <span key={fullStars + i} style={{ color: 'lightgray' }}>★</span>
      ))}
    </div>
  );
};

// *********** App ************* //
export const app = new Frog({ title: 'RateCaster' })
 
app.frame('/', async (c) => {

  return c.res({
    action: '/fapps',
    image: (
      <div style={{ color: 'white', backgroundColor: '#7e5bc2', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', height: '100vh' }}>
        
        <div style={{ display: 'flex', textAlign: 'center', marginBottom: '20px' }}>
          <h1 style={{ color: '#FFD700', fontSize: 64 }}>
            Explore Farcaster Ecosystem
          </h1>
        </div>
        <div style={{ display: 'flex', height: '40px' }}></div> {/* Spacer */}
        <div style={{ display: 'flex', textAlign: 'center' }}>
          <h2 style={{ color: 'white', fontSize: 48 }}>
            Start Here & Explore Fapps
          </h2>
        </div>
      </div>
    ),
    intents: [
      <Button value='random'>Random</Button>,
      <Button value='top'>Top Rated</Button>
    ]

  })
})
// Main page that displays Top Farcaster Apps based on their ratings and provides links to their websites
app.frame('/fapps', async (c) => {
  const { buttonValue } = c;
  const dappResult = await fetchGraphQLRegisteredDapps();
  let ratingsMap: RatingsMap = {};
  let top3Dapps: any[] = [];
  let header: string = 'Top';

  if (dappResult && dappResult.data) {
    try {
      const ratingsData = await fetchDappRatings();
      if (ratingsData && ratingsData.data) {
        console.log(ratingsData.data.dappRatingSubmitteds);
        ratingsMap = computeAverageRatings(ratingsData.data.dappRatingSubmitteds);
      }
    } catch (ratingsError) {
      console.error("Error fetching ratings:", ratingsError);
    }

    const enrichedDapps = dappResult.data.dappRegistereds.map(dapp => ({
      ...dapp,
      averageRating: ratingsMap[dapp.dappId]?.averageRating ?? 0,
      ratingsCount: ratingsMap[dapp.dappId]?.count ?? 0
    }));
    
    
    if(buttonValue === 'random') {
        top3Dapps = getRandomApps(enrichedDapps, 3);
        header = 'Random';
    } else {
        const sortedDapps = enrichedDapps.sort((a, b) => {
        const scoreA = a.averageRating * a.ratingsCount;
        const scoreB = b.averageRating * b.ratingsCount;
        return scoreB - scoreA;
      });
      top3Dapps = sortedDapps.slice(0, 3);
      header = 'Top';
    }
    
    console.log(top3Dapps)
  }

  return c.res({
    action: '/fapp-info',
    image: (
      <div style={{ color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', fontSize: 24, padding: '20px', backgroundColor: '#7e5bc2'}}>
        <div style={{ color: '#FFD700', fontSize: 64, display: 'flex' }}>{header} 3 Farcaster Apps:</div>
        <hr style={{ width: '100%', borderColor: 'white', marginBottom: '10px' }} />
        {top3Dapps.map((dapp, index) => (
          <div key={dapp.id} style={{ fontSize: 42, display: 'flex', flexDirection: 'row', alignItems: 'center',  borderRadius: '2px', width: '100%', }}>
            <h3 style={{ color: 'white', marginRight: '10px' }}>
              {index + 1}.<a style={{ color: '#ADD8E6' }}>&nbsp;{dapp.name}:</a>
            </h3>
            <p style={{ color: 'white', marginRight: '10px' }}>{truncateText(dapp.description, 30)}</p>
            <p style={{ color: 'white', marginRight: '10px' }}>{generateStars(dapp.averageRating)}</p>
          </div>
        ))}
      </div>
    ),
    intents: [
      ...top3Dapps.map((dapp, index) => (
        <Button value={dapp.name}>{(index + 1).toString()}. {dapp.name}</Button>
      )),
      <Button.Link href='https://www.ratecaster.xyz/'>See All</Button.Link>
    ]
  });
});


app.frame('/fapp-info', async (c) => {
  const { buttonValue } = c;
  const appname = buttonValue;
  let dapp: DappRegistered | undefined;

  const dappResult = await fetchGraphQLRegisteredDapps();
  console.log(dappResult?.data.dappRegistereds)
  if(dappResult && dappResult.data) {
    dapp = dappResult.data.dappRegistereds.find(dapp => dapp.name.toLowerCase() === appname?.toLowerCase());
    if(dapp){
    return c.res({
      action: '/review/' + appname,
      image: (
        <div style={{ color: 'white', backgroundColor: '#7e5bc2', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '20px', height: '100%' }}>
          <h1 style={{ color: '#FFD700', marginBottom: '20px', fontSize: 64 }}>{appname}</h1>
          <hr style={{ width: '100%', borderColor: 'white', marginBottom: '10px' }} />
          <h2 style={{ color: 'white', marginBottom: '20px', fontSize: 48 }}>{dapp.description}</h2>
          <h2 style={{ color: '#ADD8E6', marginRight: '10px', marginTop: 'auto', fontSize: 48 }}>Wanna Rate or Visit the Fapp?</h2>
        </div>
      ),
      intents: [
        <Button value='appname'>Rate!</Button>,
        <Button.Link href={dapp.url}>Visit {appname || ''}</Button.Link>
      ]
    })
  }
}

return c.error({message: "Coundn't find the App"});

})

// Frame to Leave a review using App Name
app.frame('/review/:appname', (c) => {
  const { buttonValue } = c
  const appname = c.req.param('appname') || buttonValue;

  return c.res({
    action: '/finish',
    image: (
      <div style={{ color: 'white', backgroundColor: '#7e5bc2', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '20px', height: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', fontSize: 48, marginBottom: '20px', flexWrap: 'wrap' }}>
        <h1 style={{ color: 'white', marginRight: '20px' }}>Rate</h1>
        <h1 style={{ color: '#FFD700', marginLeft: '20px' }}>{appname}</h1>
      </div>
        <hr style={{ width: '100%', borderColor: 'white', marginBottom: '20px' }} />
        <h2 style={{ color: '#ADD8E6', marginTop: 'auto', fontSize: 48 }}>Cast Your Vote: 1-5 Stars</h2>
    </div>
    ),
    intents: [
      <TextInput placeholder='Rate 1-5:'/>,
      <Button.Transaction target={`/submit-review/${appname}`}>Rate</Button.Transaction>
    ]
  })
})

app.transaction('/submit-review/:appname', async (c) => {
  const name = c.req.param('appname');
  const { inputText } = c;

  const dappResult = await fetchGraphQLRegisteredDapps();
  console.log(dappResult?.data.dappRegistereds)
  let dappId: BytesLike = '';
  
  if(dappResult && dappResult.data) {
    const dapp = dappResult.data.dappRegistereds.find(dapp => dapp.name.toLowerCase() === name.toLowerCase());
    if (dapp) {
      dappId = dapp.dappId;
      console.log(`Dapp ID: ${dappId}`);
    } else {
      console.log('Dapp not found');
    }
  }
  return c.contract({
    abi: DappRatingSystemABI,
    chainId: 'eip155:84532',
    functionName: 'addDappRating',
    args: [dappId, parseInt(inputText ?? '', 10), ' '],
    to: '0x30A622c03aaf163F9eEEF259aAc49d261047CB53'
  })

})

app.frame('/finish', (c) => {
  // const { transactionId } = c
  return c.res({
    image: (
      <div style={{ color: 'white', backgroundColor: '#7e5bc2', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '20px', height: '100%' }}>
        <h1 style={{ color: '#FFD700', marginBottom: '20px', fontSize: 64 }}>Success</h1>
        <hr style={{ width: '100%', borderColor: 'white', marginBottom: '20px' }} />
        <div style={{ color: '#ADD8E6', display: 'flex', fontSize: 48 }}>
          Thank you for Casting your Vote!
        </div>
      </div>
    )
  });
});

// ******** Test Functions ******//
app.frame('registerCaster', (c) => {
  return c.res({
    image: (
      <div style={{ color: 'white', display: 'flex', fontSize: 60 }}>
        Register your Caster!
      </div>
    ),
    intents: [
      <TextInput placeholder="Name" />,
      <TextInput placeholder='URL' />,
      <TextInput placeholder='Description' />,
      <Button.Transaction target="register">Register</Button.Transaction>
    ]
  })
})

app.transaction('/register', (c) => {
  const { inputText } = c;
  console.log(inputText);
  
  return c.contract({
    abi: DappRatingSystemABI,
    chainId: 'eip155:84532',
    functionName: 'registerDapp',
    args: ['Yup', 'Decentralized Social All-In-One.', 'https://yup.io/'],
    to: '0x30A622c03aaf163F9eEEF259aAc49d261047CB53'
  })

})

// app.transaction('review', (c) => {
//   const { frameData } = c
//   const { fid, buttonIndex } = frameData;

//   return c.contract({
//     abi: DappRatingSystemABI,
//     chainId: 'eip155:84532',
//     functionName: 'registerDapp',
//     args: ['Yup', 'Decentralized Social All-In-One.', 'https://yup.io/'],
//     to: '0x30A622c03aaf163F9eEEF259aAc49d261047CB53'
//   })
// })



 
//

// app.frame('/', async (c) => {
//   const dappResult = await fetchGraphQLRegisteredDapps();
//   let ratingsMap: RatingsMap = {};
//   let enrichedDapps: string | any[] = [];
//   let top5Dapps: any[] = [];

//   if (dappResult && dappResult.data) {
//     try {
//       const ratingsData = await fetchDappRatings();
//       if (ratingsData && ratingsData.data) {
//         console.log(ratingsData.data.dappRatingSubmitteds);
//         ratingsMap = computeAverageRatings(ratingsData.data.dappRatingSubmitteds);
//       }
//     } catch (ratingsError) {
//       console.error("Error fetching ratings:", ratingsError);
//     }

//     enrichedDapps = dappResult.data.dappRegistereds.map(dapp => ({
//       ...dapp,
//       averageRating: ratingsMap[dapp.dappId] ?? 0,
//     }));
//     top5Dapps = enrichedDapps.slice(0, 3);
//     console.log(dappResult.data);
//   }
//   return c.res({
//     image: (
//       <Box alignHorizontal="left" backgroundColor="background" padding="small" width="100%" display="flex" fontSize={{ custom: '48px' }}>
//         <VStack gap="small">
//           <Heading size="64">Top 3 Farcaster Apps:</Heading>
          
//           {top5Dapps.map((dapp, index) => (
//             <Box fontSize={{ custom: '32px' }}  width="100%" display='flex' flexDirection="row"  borderColor="lightBlue" >
//               <Text color="text">
//                  {index + 1}) {dapp.name} -
//               </Text>
//               <Text color="text"> {generateStars(dapp.averageRating)}</Text>
//               <Text color="text"> - {dapp.description}</Text>
              
//             </Box>
//           ))}

//         </VStack>
//       </Box>
//     )
//   })
// });


devtools(app, {serveStatic})