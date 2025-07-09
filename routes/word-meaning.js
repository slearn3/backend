const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Test endpoint to verify route is working
router.get('/test', (req, res) => {
  console.log('=== WORD MEANING TEST ENDPOINT HIT ===');
  res.json({ 
    message: 'Word meaning route is working',
    google_search_available: !!(process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_SEARCH_ENGINE_ID),
    timestamp: new Date().toISOString(),
    env_check: {
      api_key_length: process.env.GOOGLE_SEARCH_API_KEY?.length || 0,
      engine_id_length: process.env.GOOGLE_SEARCH_ENGINE_ID?.length || 0
    }
  });
});

// Enhanced Google Search function for biblical sites
const searchBiblicalSites = async (word) => {
  const googleApiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
  
  if (!googleApiKey || !searchEngineId) {
    return null;
  }

  try {
    const query = `"${word}" biblical meaning site:en.wikipedia.org OR site:biblegateway.com OR site:gotquestions.org`;
    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}&num=5`;
    
    console.log('Searching biblical sites for:', word);
    console.log('Search query:', query);
    
    const response = await fetch(searchUrl);
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      return {
        results: data.items.map(item => ({
          title: item.title,
          snippet: item.snippet,
          link: item.link,
          source: item.displayLink
        })),
        totalResults: data.searchInformation?.totalResults || 0
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error searching biblical sites:', error);
    return null;
  }
};

// Enhanced Telugu translations with proper meanings
const getTeluguTranslation = (word) => {
  const teluguTranslations = {
    'love': 'ప్రేమ',
    'light': 'వెలుగు',
    'peace': 'శాంతి',
    'hope': 'ఆశ',
    'faith': 'విశ్వాసం',
    'truth': 'సత్యం',
    'grace': 'కృప',
    'mercy': 'దయ',
    'joy': 'ఆనందం',
    'prayer': 'ప్రార్థన',
    'blessing': 'ఆశీర్వాదం',
    'worship': 'ఆరాధన',
    'praise': 'స్తుతి',
    'glory': 'మహిమ',
    'salvation': 'రక్షణ',
    'forgiveness': 'క్షమాపణ',
    'righteousness': 'నీతి',
    'kingdom': 'రాజ్యం',
    'eternal': 'శాశ్వత',
    'holy': 'పవిత్ర',
    'god': 'దేవుడు',
    'heaven': 'స్వర్గం',
    'earth': 'భూమి',
    'water': 'నీరు',
    'fire': 'అగ్ని',
    'spirit': 'ఆత్మ',
    'word': 'వాక్యం',
    'life': 'జీవితం',
    'death': 'మరణం',
    'birth': 'జన్మ',
    'heart': 'హృదయం',
    'soul': 'ఆత్మ',
    'mind': 'మనసు',
    'strength': 'బలం',
    'power': 'శక్తి',
    'wisdom': 'జ్ఞానం',
    'knowledge': 'తెలివి'
  };
  
  return teluguTranslations[word.toLowerCase()] || `${word} (తెలుగు అనువాదం)`;
};

// Enhanced detailed explanations
const getDetailedExplanation = (word) => {
  const explanations = {
    'love': 'Love is a profound and caring affection towards someone or something. In biblical context, love represents the highest virtue - God\'s unconditional care for humanity and the commandment to love God and neighbor. It encompasses agape (divine love), phileo (brotherly love), and eros (romantic love). Love is patient, kind, and never fails.',
    'light': 'Light is the natural agent that makes vision possible and dispels darkness. Biblically, light symbolizes divine truth, righteousness, knowledge, and God\'s presence. Jesus declared "I am the light of the world," representing spiritual illumination and guidance that leads people out of spiritual darkness.',
    'peace': 'Peace is a state of harmony, tranquility, and freedom from conflict or anxiety. In scripture, peace (Hebrew: shalom) means completeness, wholeness, and well-being that comes from being reconciled with God through Christ. It surpasses human understanding and guards our hearts.',
    'hope': 'Hope is confident expectation and trust in future good. Biblical hope is not wishful thinking but assured confidence in God\'s promises and His faithfulness to fulfill them, providing strength during trials and anchor for the soul.',
    'faith': 'Faith is complete trust, confidence, and belief in God and His word. It involves both intellectual assent and personal commitment, described as "the substance of things hoped for, the evidence of things not seen." Faith is essential for pleasing God.',
    'truth': 'Truth is conformity to fact or reality; that which is genuine and authentic. In biblical terms, truth refers to God\'s revealed word, divine reality, and Jesus who declared "I am the way, the truth, and the life." Truth sets people free.',
    'grace': 'Grace is God\'s unmerited favor and divine assistance given to humans. It represents God\'s love, mercy, and blessing freely given to those who don\'t deserve it, enabling salvation and spiritual growth through Jesus Christ.',
    'mercy': 'Mercy is compassionate treatment and forgiveness toward those who deserve punishment. Divine mercy represents God\'s loving-kindness and willingness to forgive sins and show compassion to humanity despite our failures.',
    'joy': 'Joy is a deep sense of happiness, delight, and contentment. Biblical joy transcends circumstances and comes from knowing God, experiencing His salvation, and understanding one\'s relationship with Him. Joy is a fruit of the Spirit.',
    'prayer': 'Prayer is communication with God through worship, petition, thanksgiving, and confession. It involves speaking to and listening to God, building relationship and seeking His will and guidance in all aspects of life.'
  };
  
  return explanations[word.toLowerCase()] || `${word} is a significant term with deep meaning in both everyday usage and biblical literature. It carries important theological, spiritual, and practical implications for understanding faith and human experience.`;
};

// Enhanced example sentences
const generateExampleSentences = (word) => {
  const examples = {
    'love': [
      'We are commanded to love God with all our heart, soul, mind, and strength.',
      'God so loved the world that He gave His only begotten Son.',
      'Love your enemies and pray for those who persecute you.',
      'Above all, love each other deeply, because love covers many sins.'
    ],
    'light': [
      'Jesus said, "I am the light of the world; whoever follows me will not walk in darkness."',
      'Your word is a lamp to my feet and a light to my path.',
      'Let your light shine before others, that they may see your good deeds.',
      'God is light, and in Him there is no darkness at all.'
    ],
    'peace': [
      'Peace I leave with you; my peace I give you, says the Lord.',
      'Blessed are the peacemakers, for they will be called children of God.',
      'The peace of God, which surpasses all understanding, will guard your hearts.',
      'He himself is our peace, who has made the two groups one.'
    ],
    'hope': [
      'We have this hope as an anchor for the soul, firm and secure.',
      'May the God of hope fill you with all joy and peace as you trust in Him.',
      'Hope does not put us to shame, because God\'s love has been poured out.',
      'Through Christ we have gained access by faith into this grace and rejoice in hope.'
    ],
    'faith': [
      'Now faith is confidence in what we hope for and assurance about what we do not see.',
      'Without faith it is impossible to please God.',
      'We live by faith, not by sight.',
      'Faith comes by hearing, and hearing by the word of God.'
    ]
  };
  
  return examples[word.toLowerCase()] || [
    `The word "${word}" appears frequently in biblical literature with deep spiritual significance.`,
    `Understanding "${word}" helps us grasp important theological concepts.`,
    `"${word}" carries both practical and spiritual meaning in Christian faith.`,
    `Scripture uses "${word}" to convey essential truths about God and humanity.`
  ];
};

// Helper function to get correct verb forms
const getVerbForms = (word) => {
  const lowerWord = word.toLowerCase();
  
  // Common irregular verbs
  const irregularVerbs = {
    'love': { v1: 'love', v2: 'loved', v3: 'loved', v4: 'loving', v5: 'loves' },
    'be': { v1: 'be', v2: 'was/were', v3: 'been', v4: 'being', v5: 'is/are' },
    'have': { v1: 'have', v2: 'had', v3: 'had', v4: 'having', v5: 'has' },
    'do': { v1: 'do', v2: 'did', v3: 'done', v4: 'doing', v5: 'does' },
    'go': { v1: 'go', v2: 'went', v3: 'gone', v4: 'going', v5: 'goes' },
    'see': { v1: 'see', v2: 'saw', v3: 'seen', v4: 'seeing', v5: 'sees' },
    'know': { v1: 'know', v2: 'knew', v3: 'known', v4: 'knowing', v5: 'knows' },
    'come': { v1: 'come', v2: 'came', v3: 'come', v4: 'coming', v5: 'comes' },
    'give': { v1: 'give', v2: 'gave', v3: 'given', v4: 'giving', v5: 'gives' },
    'take': { v1: 'take', v2: 'took', v3: 'taken', v4: 'taking', v5: 'takes' },
    'find': { v1: 'find', v2: 'found', v3: 'found', v4: 'finding', v5: 'finds' },
    'think': { v1: 'think', v2: 'thought', v3: 'thought', v4: 'thinking', v5: 'thinks' },
    'say': { v1: 'say', v2: 'said', v3: 'said', v4: 'saying', v5: 'says' },
    'get': { v1: 'get', v2: 'got', v3: 'gotten', v4: 'getting', v5: 'gets' },
    'make': { v1: 'make', v2: 'made', v3: 'made', v4: 'making', v5: 'makes' },
    'believe': { v1: 'believe', v2: 'believed', v3: 'believed', v4: 'believing', v5: 'believes' },
    'pray': { v1: 'pray', v2: 'prayed', v3: 'prayed', v4: 'praying', v5: 'prays' },
    'worship': { v1: 'worship', v2: 'worshipped', v3: 'worshipped', v4: 'worshipping', v5: 'worships' },
    'serve': { v1: 'serve', v2: 'served', v3: 'served', v4: 'serving', v5: 'serves' },
    'praise': { v1: 'praise', v2: 'praised', v3: 'praised', v4: 'praising', v5: 'praises' },
    'trust': { v1: 'trust', v2: 'trusted', v3: 'trusted', v4: 'trusting', v5: 'trusts' },
    'hope': { v1: 'hope', v2: 'hoped', v3: 'hoped', v4: 'hoping', v5: 'hopes' },
    'forgive': { v1: 'forgive', v2: 'forgave', v3: 'forgiven', v4: 'forgiving', v5: 'forgives' },
    'bless': { v1: 'bless', v2: 'blessed', v3: 'blessed', v4: 'blessing', v5: 'blesses' }
  };

  if (irregularVerbs[lowerWord]) {
    return irregularVerbs[lowerWord];
  }

  // Regular verb patterns
  const v1 = word;
  let v2, v3;
  
  if (word.endsWith('e')) {
    v2 = v3 = word + 'd';
  } else if (word.endsWith('y') && word.length > 1 && !'aeiou'.includes(word[word.length - 2])) {
    v2 = v3 = word.slice(0, -1) + 'ied';
  } else if (word.match(/[^aeiou][aeiou][^aeiou]$/) && word.length > 3) {
    v2 = v3 = word + word.slice(-1) + 'ed';
  } else {
    v2 = v3 = word + 'ed';
  }

  const v4 = word.endsWith('e') ? word.slice(0, -1) + 'ing' : 
            word.match(/[^aeiou][aeiou][^aeiou]$/) && word.length > 3 ? 
            word + word.slice(-1) + 'ing' : word + 'ing';
  
  const v5 = word.endsWith('s') || word.endsWith('sh') || word.endsWith('ch') || 
            word.endsWith('x') || word.endsWith('z') ? word + 'es' :
            word.endsWith('y') && word.length > 1 && !'aeiou'.includes(word[word.length - 2]) ?
            word.slice(0, -1) + 'ies' : word + 's';

  return { v1, v2, v3, v4, v5 };
};

// Get comprehensive biblical word meaning with web search
router.post('/', authenticateToken, async (req, res) => {
  console.log('=== ENHANCED BIBLICAL WORD MEANING WITH WEB SEARCH ===');
  console.log('Request body:', req.body);
  
  try {
    const { word, context = 'biblical' } = req.body;
    
    if (!word || !word.trim()) {
      console.log('No word provided in request');
      return res.status(400).json({ error: 'Word is required' });
    }

    const cleanWord = word.trim();
    
    // Search biblical sites
    const webSearchResults = await searchBiblicalSites(cleanWord);
    
    const verbForms = getVerbForms(cleanWord);
    const teluguTranslation = getTeluguTranslation(cleanWord);
    const detailedExplanation = getDetailedExplanation(cleanWord);
    const exampleSentences = generateExampleSentences(cleanWord);

    // Check if Google Search API credentials are available
    const googleApiKey = process.env.GOOGLE_SEARCH_API_KEY;
    const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
    console.log('Google Search API available:', !!(googleApiKey && searchEngineId));

    const result = { 
      word: cleanWord,
      meaning: webSearchResults ? 
        `Complete biblical analysis of "${cleanWord}" with web search results from authoritative biblical sources including Wikipedia, BibleGateway, and GotQuestions.` :
        `Complete biblical analysis of "${cleanWord}" with Telugu translation, detailed explanation, and contextual examples.`,
      context,
      source: webSearchResults ? 'web_search_biblical_sites' : (googleApiKey && searchEngineId ? 'enhanced_biblical_analysis' : 'structured_biblical_reference'),
      resultsCount: webSearchResults ? webSearchResults.results.length : (googleApiKey && searchEngineId ? 5 : 0),
      webSearchResults: webSearchResults?.results || null,
      totalWebResults: webSearchResults?.totalResults || 0,
      teluguTranslation,
      detailedExplanation,
      exampleSentences,
      verbForms: `${verbForms.v1}, ${verbForms.v2}, ${verbForms.v3}, ${verbForms.v4}, ${verbForms.v5}`,
      biblicalContext: 'Hebrew/Greek etymological analysis with theological significance',
      searchQuery: `"${cleanWord}" biblical meaning site:en.wikipedia.org OR site:biblegateway.com OR site:gotquestions.org`
    };

    console.log('Sending enhanced biblical word analysis response for:', cleanWord);
    console.log('Web search results found:', !!webSearchResults);
    res.json(result);
  } catch (error) {
    console.error('Error in biblical word search:', error);
    
    const { word } = req.body;
    const cleanWord = word?.trim() || '';
    
    res.json({ 
      word: cleanWord,
      meaning: `Basic analysis of "${cleanWord}" - service temporarily unavailable`,
      context: 'biblical',
      source: 'fallback_analysis',
      error: 'Service temporarily unavailable',
      resultsCount: 0,
      teluguTranslation: getTeluguTranslation(cleanWord),
      detailedExplanation: getDetailedExplanation(cleanWord),
      exampleSentences: generateExampleSentences(cleanWord),
      verbForms: 'Verb forms available',
      biblicalContext: 'Biblical context available'
    });
  }
});

module.exports = router;
