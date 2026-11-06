// Further reading for System Design chapters: papers, engineering blogs and talks, from the resource list of the public
// study notes that set the topic list. Each link was checked; moved pages point to their new address, and dead ones to an
// Internet Archive copy. Titles are the source's own.
import type { Reading } from "./types.ts";

export const READING: Record<string, Reading[]> = {
  reliability: [
    { title: "Circuit Breaker", by: "Martin Fowler", url: "https://martinfowler.com/bliki/CircuitBreaker.html" },
  ],
  ratelimit: [
    { title: "ratelimit: a leaky-bucket rate limiter in Go", by: "Uber (source code)", url: "https://github.com/uber-go/ratelimit/blob/main/ratelimit.go" },
  ],
  data: [
    { title: "Consistent Hashing", by: "Tom White", url: "https://tom-e-white.com/2007/11/consistent-hashing.html" },
    { title: "CS168 lecture 1: Introduction and Consistent Hashing", by: "Tim Roughgarden, Stanford (PDF)", url: "https://theory.stanford.edu/~tim/s16/l/l1.pdf" },
    { title: "Cassandra: A Decentralized Structured Storage System", by: "Lakshman and Malik, LADIS 2009 (PDF)", url: "https://www.cs.cornell.edu/Projects/ladis2009/papers/lakshman-ladis2009.pdf" },
    { title: "How Discord Scaled Elixir to 5,000,000 Concurrent Users", by: "Discord", url: "https://discord.com/blog/how-discord-scaled-elixir-to-5-000-000-concurrent-users" },
    { title: "Maglev: A Fast and Reliable Software Network Load Balancer", by: "Google, NSDI 2016 (PDF)", url: "https://static.googleusercontent.com/media/research.google.com/en//pubs/archive/44824.pdf" },
  ],
  kvstore: [
    { title: "Dynamo: Amazon's Highly Available Key-value Store", by: "Amazon, SOSP 2007 (PDF)", url: "https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf" },
    { title: "Amazon's Dynamo", by: "Werner Vogels", url: "https://www.allthingsdistributed.com/2007/10/amazons_dynamo.html" },
    { title: "Bigtable: A Distributed Storage System for Structured Data", by: "Google, OSDI 2006 (PDF)", url: "https://static.googleusercontent.com/media/research.google.com/en//archive/bigtable-osdi06.pdf" },
    { title: "Cassandra 3.0 architecture", by: "DataStax docs", url: "https://docs.datastax.com/en/archived/cassandra/3.0/cassandra/architecture/archIntro.html" },
    { title: "Amazon DynamoDB Deep Dive: Advanced Design Patterns (DAT401)", by: "AWS re:Invent 2018 (video)", url: "https://www.youtube.com/watch?v=HaEPXoXVf2k" },
    { title: "Amazon DynamoDB Under the Hood: How We Built a Hyper-Scale Database (DAT321)", by: "AWS re:Invent 2018 (video)", url: "https://www.youtube.com/watch?v=yvBR71D0nAQ" },
  ],
  ids: [
    { title: "Ticket Servers: Distributed Unique Primary Keys on the Cheap", by: "Flickr", url: "https://code.flickr.net/2010/02/08/ticket-servers-distributed-unique-primary-keys-on-the-cheap/" },
    { title: "Announcing Snowflake", by: "Twitter Engineering, 2010", url: "https://blog.x.com/engineering/en_us/a/2010/announcing-snowflake" },
    { title: "snowflake (source code, archived)", by: "Twitter", url: "https://github.com/twitter-archive/snowflake" },
  ],
  crawler: [
    { title: "Web Crawling", by: "Olston and Najork (PDF, Internet Archive copy)", url: "https://web.archive.org/web/20210717204434/http://infolab.stanford.edu/~olston/publications/crawling_survey.pdf" },
    { title: "Dynamic rendering as a workaround", by: "Google Search Central", url: "https://developers.google.com/search/docs/crawling-indexing/javascript/dynamic-rendering" },
  ],
  messaging: [
    { title: "How Discord Stores Billions of Messages", by: "Discord", url: "https://discord.com/blog/how-discord-stores-billions-of-messages" },
    { title: "Flannel: An Application-Level Edge Cache to Make Slack Scale", by: "Slack Engineering", url: "https://slack.engineering/flannel-an-application-level-edge-cache-to-make-slack-scale/" },
  ],
  typeahead: [
    { title: "How We Built Prefixy: A Scalable Prefix Search Service for Powering Autocomplete", by: "Prefixy team", url: "https://medium.com/@prefixyteam/how-we-built-prefixy-a-scalable-prefix-search-service-for-powering-autocomplete-c20f98e2eff1" },
    { title: "Prefix Hash Tree: An Indexing Data Structure over Distributed Hash Tables", by: "UC Berkeley (PDF)", url: "https://people.eecs.berkeley.edu/~sylvia/papers/pht.pdf" },
  ],
  video: [
    { title: "YouTube Architecture", by: "High Scalability", url: "https://highscalability.com/youtube-architecture/" },
    { title: "Seattle Conference on Scalability: YouTube Scalability", by: "Google Talks Archive (video)", url: "https://www.youtube.com/watch?v=w5WVu624fY8" },
    { title: "Transcoding: How We Serve Videos at Scale", by: "Egnyte (Internet Archive copy)", url: "https://web.archive.org/web/20191114232634/https://www.egnyte.com/blog/2018/12/transcoding-how-we-serve-videos-at-scale/" },
    { title: "Under the hood: Broadcasting live video to millions", by: "Facebook Engineering", url: "https://engineering.fb.com/2015/12/03/ios/under-the-hood-broadcasting-live-video-to-millions/" },
    { title: "High Quality Video Encoding at Scale", by: "Netflix Tech Blog", url: "https://netflixtechblog.com/high-quality-video-encoding-at-scale-d159db052746" },
    { title: "Optimized shot-based encodes: Now Streaming!", by: "Netflix Tech Blog", url: "https://netflixtechblog.com/optimized-shot-based-encodes-now-streaming-4b9464204830" },
  ],
  storage: [
    { title: "Differential Synchronization", by: "Neil Fraser", url: "https://neil.fraser.name/writing/sync/" },
    { title: "Differential Synchronization", by: "Google TechTalks (video)", url: "https://www.youtube.com/watch?v=S2Hp_1jqpY8" },
    { title: "How We've Scaled Dropbox", by: "Stanford (video)", url: "https://www.youtube.com/watch?v=PE4gwstWhmc" },
  ],
};
