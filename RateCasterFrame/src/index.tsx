import { Button, Frog, TextInput } from 'frog'
import DappRatingSystemABI from '../public/abi/DappRatingSystem.json' assert { type: 'json' };
import {
  DappRegistered,
  fetchDappRatings,
  fetchGraphQLRegisteredDapps,
  fetchGraphQLRandomRegisteredDapp,
} from "./graphQL/fetchFromSubgraph.js";
import { RatingsMap, computeAverageRatings, getRandomApps } from './utils/helpers.js'
import { devtools } from 'frog/dev'
import { serveStatic } from 'frog/serve-static'
import { updateScore } from './utils/storage.js';
// *********** Helpers ************* //
// const generateStars = (rating: number) => {
//   const fullStars = Math.floor(rating);
//   const halfStar = rating % 1 !== 0;
//   const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

//   return (
//     <div style={{ display: 'flex', alignItems: 'center' }}>
//       {[...Array(fullStars)].map((_, i) => (
//         <span key={i} style={{ color: '#FFD700' }}>*</span>
//       ))}
//       {halfStar && <span style={{ color: '#FFD700' }}>*</span>}
//       {[...Array(emptyStars)].map((_, i) => (
//         <span key={fullStars + i} style={{ color: 'lightgray' }}>*</span>
//       ))}
//     </div>
//   );
// };
const generateStars = (rating: number) => {
  const roundedRating = rating % 1 === 0 ? rating.toString() : rating.toFixed(1);
  const starText = `${roundedRating}/5`;
  return starText;
};

function parseButtonValue(buttonValue: string | undefined): number {
  // Check if buttonValue is undefined or null
  if (buttonValue === undefined || buttonValue === null) {
      return 0;
  }

  // Convert buttonValue to a number
  let numberValue = Number(buttonValue);

  // Check if numberValue is NaN or not a finite number
  if (isNaN(numberValue) || !Number.isFinite(numberValue)) {
      return 0; // Return 0 if numberValue is NaN or not finite
  }

  return Math.floor(numberValue); // Ensure we return an integer value
}

// *********** App - Frame #1 - Explore Farcaster ************* //
export const app = new Frog({ 
  title: 'RateCaster', 
  verify: 'silent',
})
 
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
            <p style={{ color: 'white', marginRight: '10px' }}>{dapp.description}</p>
            <p style={{ marginRight: '10px', fontSize: '42px', color: '#FFD700'}}>{generateStars(dapp.averageRating)}</p>
          </div>
        ))}
      </div>
    ),
    intents: [
      ...top3Dapps.map((dapp) => (
        <Button value={dapp.name}>{dapp.name}</Button>
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
  console.log(dappResult?.data.dappRegistereds);

  if(dappResult && dappResult.data) {
    dapp = dappResult.data.dappRegistereds.find((dapp: { name: string; }) => dapp.name.toLowerCase() === appname?.toLowerCase());
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
  const buttonValue = 'Warpcaster';
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
  let dappId;
  
  if(dappResult && dappResult.data) {
    const dapp = dappResult.data.dappRegistereds.find((dapp: { name: string; }) => dapp.name.toLowerCase() === name.toLowerCase());
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

/***********************************************************************************************
 *                        Frame #2:   Farcaster Knowledge Test                                 *
 **********************************************************************************************/

app.frame('/knowledge-check', async (c) => {
  return c.res({
    action: '/knowledge-check/test/0',
    image: (
      <div style={{ color: 'white', backgroundColor: '#7e5bc2', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', height: '100vh' }}>
        
        <div style={{ display: 'flex', textAlign: 'center', marginBottom: '20px' }}>
          <h1 style={{ color: '#FFD700', fontSize: 64 }}>
            You think you know Farcaster Apps?
          </h1>
        </div>
        <div style={{ display: 'flex', height: '40px' }}></div> 
        <div style={{ display: 'flex', textAlign: 'center' }}>
          <h2 style={{ color: 'white', fontSize: 48 }}>
            Test you knowledge!
          </h2>
        </div>
      </div>
    ),
    intents: [
      <Button value='random'>Fight</Button>,
    ]

  })
})

app.frame('/knowledge-check/test/:counter', async (c) => {
  const { buttonValue } = c;
  const randomApp = await fetchGraphQLRandomRegisteredDapp();
  let app = randomApp?.data.dappRegistered;
  let score = parseButtonValue(buttonValue);
  let counter = parseButtonValue(c.req.param('counter'));

  console.log(score);
  if (app && counter < 4) {
        return c.res({
          action: '/knowledge-check/test/' + (counter + 1),
          image: (
            <div style={{
              color: 'white',
              backgroundColor: '#7e5bc2',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px',
              height: '100%',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <h1 style={{
                color: '#FFD700', 
                marginBottom: '30px', 
                fontSize: '3em', 
                fontWeight: 'bold', 
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
              }}>Is this Farcaster App?</h1>
              <hr style={{
                width: '80%', 
                borderColor: 'rgba(255,255,255,0.5)', 
                marginBottom: '20px',
                opacity: 0.5
              }} />
              <h2 style={{
                color: '#ADD8E6', 
                marginBottom: '20px', 
                fontSize: '2.5em', 
                fontWeight: 'normal',
                textTransform: 'uppercase',
                letterSpacing: '2px'
              }}>{app.name}</h2>
            </div>
          ),
          intents: [
            <Button value={String(score + 20)}>Yes!</Button>,
            <Button value={String(score - 20)}>Nope</Button>
          ]
      })
  } else if (app && counter == 4){
    return c.res({
      action: '/knowledge-check/result/' + (counter + 1),
      image: (
        <div style={{
          color: 'white',
          backgroundColor: '#7e5bc2',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          height: '100%',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <h1 style={{
            color: '#FFD700', 
            marginBottom: '30px', 
            fontSize: '3em', 
            fontWeight: 'bold', 
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
          }}>Is this Farcaster App?</h1>
          <hr style={{
            width: '80%', 
            borderColor: 'rgba(255,255,255,0.5)', 
            marginBottom: '20px',
            opacity: 0.5
          }} />
          <h2 style={{
            color: '#ADD8E6', 
            marginBottom: '20px', 
            fontSize: '2.5em', 
            fontWeight: 'normal',
            textTransform: 'uppercase',
            letterSpacing: '2px'
          }}>{app.name}</h2>
        </div>
      ),
      intents: [
        <Button value={String(score + 20)}>Yes!</Button>,
        <Button value={String(score - 20)}>Nope</Button>
      ]
  })
  } else {
    return c.error({message: "Coundn't find the App"});
  }
});

interface ScoreDescription {
  score: number;
  description: string;
  farcasterRole?: string;
}

const scoringSystem: ScoreDescription[] = [
  {
    score: 100,
    description: "Woo, You're an Expert!",
    farcasterRole: "You should be running the Farcaster ecosystem by now!"
  },
  {
    score: 80,
    description: "Almost Pro",
    farcasterRole: "With your skills, you could definitely advise on how Farcaster apps should evolve!"
  },
  {
    score: 60,
    description: "Not Bad, prob",
    farcasterRole: "You're on your way to becoming a key player in the Farcaster community."
  },
  {
    score: 40,
    description: "You're Getting There, Kinda..",
    farcasterRole: "Keep learning, and soon you'll be shaping Farcaster's future."
  },
  {
    score: 20,
    description: "You Tried, Badly",
    farcasterRole: "Maybe start by joining a Farcaster app user group?"
  },
  {
    score: 0,
    description: "Are You Even Trying?",
    farcasterRole: "Time to dive into Farcaster basics, perhaps?"
  }
];

function getScoreDescription(score: number): ScoreDescription {
  const scoreEntry = scoringSystem.find(entry => entry.score === score);
  return scoreEntry ? scoreEntry : getScoreDescription(0);
}

app.frame('/knowledge-check/result/:counter', (c) => {
  const { buttonValue, frameData } = c;
  let counter = parseButtonValue(c.req.param('counter'));
  let score = parseButtonValue(buttonValue);

  if (frameData){
      const { fid } = frameData;
      updateScore(String(fid), score);
  }

  const result = getScoreDescription(score);
  return c.res({
    image: (
        <div style={{
          color: 'white',
          backgroundColor: '#7e5bc2',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          height: '100%',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <h1 style={{
            color: '#FFD700', 
            marginBottom: '30px', 
            fontSize: '2.5em', 
            fontWeight: 'bold', 
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
          }}>{result.description}</h1>
          <hr style={{
            width: '80%', 
            borderColor: 'rgba(255,255,255,0.5)', 
            marginBottom: '20px',
            opacity: 0.5
          }} />
          <div style={{
            color: '#ADD8E6', 
            fontSize: '1.5em', 
            fontWeight: 'normal',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginTop: '10px'
          }}>
            {result.farcasterRole}
          </div>
        </div>
    )
  });
});

devtools(app, { serveStatic })
export default app
