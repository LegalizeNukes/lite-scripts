# Scriptlets

Lightweight userscripts for common video, social-media, navigation, and reading-site tasks. They are intended for userscript managers and other compatible script-hosting environments.

The `.user.js` files are the canonical versions in this collection. They can be used with managers such as Tampermonkey, Violentmonkey, or Greasemonkey. Brave Browser is also supported, including environments that accept custom scriptlets.

> [!WARNING]
> Always review third-party code before executing it in your browser environment.

## Usage

### Userscript managers

Install the corresponding `.user.js` file in your userscript manager. Keep the userscript metadata block at the top of each file so the manager can identify its name, sites, and permissions.

### Brave Custom Scriptlets

The lower **Brave Custom Scriptlets** section is specifically for Brave Browser's scriptlet system. Open `brave://settings/shields/filters/`, add each scriptlet using the listed filename and the script body without its userscript metadata block, then add the corresponding `domain##+js(...)` rule to **Create Custom Filters**.

## Included userscripts

| File | Purpose | Upstream source |
| --- | --- | --- |
| `Bypass Paywalls.user.js` | Removes paywall barriers on supported sites. | [Bypass Paywalls Clean Filters](https://gitflic.ru/project/magnolia1234/bypass-paywalls-clean-filters) |
| `DeArrow Titles YouTube.user.js` | Replaces YouTube titles with DeArrow titles. | [DeArrow](https://github.com/ajayyy/DeArrow) |
| `Hide Nav Bars.user.js` | Hides fixed or sticky top and bottom navigation bars while scrolling down. Intended for mobile devices. | — |
| `Location Blocking X.user.js` | Displays X account locations and optionally filters posts. | [x-account-location-device](https://github.com/xaitax/x-account-location-device) |
| `Redirect Google Maps.user.js` | Opens coordinate-based Google Maps links in Apple Maps. | — |
| `Redirect Imgur.user.js` | Redirects Imgur pages to Rimgo. | — |
| `Redirect Instagram.user.js` | Redirects Instagram pages to Imginn. | — |
| `Redirect X.user.js` | Redirects supported X pages to Xcancel. | — |
| `Return Dislikes YouTube.user.js` | Restores YouTube dislike counts. | [Return YouTube Dislike userscript](https://github.com/Anarios/return-youtube-dislike/raw/main/Extensions/UserScript/Return%20Youtube%20Dislike.user.js) |
| `SponsorBlock YouTube.user.js` | Skips SponsorBlock segments in YouTube videos. | [sb.js](https://github.com/mchangrh/sb.js) |

### Location Blocking X preferences

`Location Blocking X.user.js` has optional settings near the top of the script:

```js
var USER_CONFIG = {
    BLOCKED_COUNTRIES: [],
    BLOCKED_POST_ACTION: 'hide',
    COMMUNITY_CACHE: true,
    REQUIRE_INTERACTION: true
};
```

- `BLOCKED_COUNTRIES` — locations to filter. Leave the array empty to disable location-based filtering.
- `BLOCKED_POST_ACTION` — controls how matching posts are handled: `hide`, `highlight`, `dim`, or `collapse`.
- `COMMUNITY_CACHE` — when `true`, checks the shared community cache first for account-location data. If no cached result is available, the script can fall back to X's API according to `REQUIRE_INTERACTION`. Requires a separate userscript extension on Brave, does not work with scriptlets.
- `REQUIRE_INTERACTION` — when `true`, direct X API lookups require clicking the question-mark indicator; community-cache lookups can still run automatically. When `false`, missing locations can also be fetched automatically from X.

# Brave Custom Scriptlets

The entries below are specifically for Brave Browser. They are arranged alphabetically by scriptlet name. `user-clean-tiktok.js` is included as a reference but is not present in this archive.

## Bypass Paywalls

### Setup

Scriptlet:

```txt
user-bypass-paywalls.js
```

Custom filter:

```js
360dx.com,abqjournal.com,accountingtoday.com,acm.media,adage.com,adelaidenow.com.au,adweek.com,afr.com,ajc.com,al-monitor.com,al.com,americanbanker.com,amp.scmp.com,app.historytoday.com,appan.newscientist.com,architecturaldigest.com,archive.today,artnet.com,asia.nikkei.com,audiop.bizjournals.com,autocar.co.uk,autonews.com,autosport.com,axios.com,azcentral.com,backpacker.com,balkaninsight.com,baltimoresun.com,barandbench.com,barrons.com,barrons.djmedia.djservices.io,bendigoadvertiser.com.au,benefitnews.com,benzinga.com,betamtb.com,betternutrition.com,betterprogramming.pub,bhaskar.com,bicycling.com,billboard.com,bizjournals.com,bloomberg.com,bloombergadria.com,bnd.com,bonappetit.com,bondbuyer.com,bordermail.com.au,bostonglobe.com,bostonherald.com,brisbanetimes.com.au,buffalonews.com,business-standard.com,businessdailyafrica.com,businessdesk.co.nz,businessinsider.com,businessinsider.jp,businessoffashion.com,businesspost.ie,businesstimes.com.sg,cairnspost.com.au,canberratimes.com.au,capital.bg,capitalgazette.com,caravanmagazine.in,centralwesterndaily.com.au,charlotteobserver.com,chicagobusiness.com,chicagotribune.com,chronicle.com,cincinnati.com,cleaneatingmag.com,cleveland.com,climbing.com,cnbc.com,cnn.com,cntraveler.com,codesports.com.au,columbian.com,commercialappeal.com,computerweekly.com,cosmopolitan.com,countryliving.com,courant.com,courier-journal.com,couriermail.com.au,crainscleveland.com,crainsdetroit.com,crainsgrandrapids.com,crainsnewyork.com,crikey.com.au,csmonitor.com,ctinsider.com,ctpost.com,curbed.com,cyclingnews.com,dailyadvertiser.com.au,dailyherald.com,dailyliberal.com.au,dailymail.com,dailypress.com,dailyrecord.co.uk,dailytelegraph.com.au,dailywire.com,dallasnews.com,daytondailynews.com,decanter.com,defector.com,delish.com,democratandchronicle.com,denik.cz,denverpost.com,desmoinesregister.com,detroitnews.com,dig-in.com,digiday.com,discovermagazine.com,dispatch.com,dn.no,dnevnik.bg,dwell.com,e.infogram.com,eastbaytimes.com,economictimes.com,economictimes.indiatimes.com,economist.com,elle.com,elledecor.com,elnuevoherald.com,enotes.com,entrepreneur.com,epaper.indiatimes.com,epaper.thetimes.com,epicurious.com,epoch.org.il,espn.com,esquire.com,euobserver.com,european-rubber-journal.com,europower.no,examiner.com.au,express.co.uk,expressnews.com,fastcompany.com,fieldandstream.com,financial-planning.com,financialexpress.com,firstthings.com,fiskeribladet.no,fmrmagazine.com,fnlondon.com,forbes.com,forbes.com.au,forbes.ua,foreignaffairs.com,foreignpolicy.com,fortune.com,foxnews.com,freedium-mirror.cfd,freep.com,fresnobee.com,frontline.thehindu.com,ft.com,ftm.eu,gbnews.com,geelongadvertiser.com.au,genomeweb.com,gitflic.ru,glossy.co,goldcoastbulletin.com.au,goodhousekeeping.com,gq.com,granta.com,grubstreet.com,haaretz.co.il,haaretz.com,harpers.org,harpersbazaar.com,hbr.org,heraldsun.com.au,hilltimes.com,hindustantimes.com,historyextra.com,historytoday.com,housebeautiful.com,houstonchronicle.com,hydrogeninsight.com,iai.tv,illawarramercury.com.au,images.thewest.com.au,images2.dwell.com,inc.com,inc42.com,independent.ie,indianexpress.com,indiatoday.in,indystar.com,infzm.com,inkl.com,inquirer.com,insidehighered.com,insights.citeline.com,interestingengineering.com,intrafish.com,intrafish.no,investors.com,ipolitics.ca,irishexaminer.com,jacksonville.com,japantimes.co.jp,jgnt.co,jobs.reachplc.com,journal-news.com,journalnow.com,journalstar.com,jpost.com,jsonline.com,kansas.com,kansascity.com,kathimerini.gr,kentucky.com,knoxnews.com,kompas.id,kystens.no,latimes.com,lehighvalleylive.com,literaryreview.co.uk,livelaw.in,livemint.com,lrb.co.uk,macrobusiness.com.au,madison.com,magazine.atavist.com,magazine.thediplomat.com,manoramaonline.com,marketwatch.com,masslive.com,mcall.com,mcclatchydc.com,mediaconcierge.co.uk,medium.com,medscape.com,menshealth.com,mercurynews.com,mexiconewsdaily.com,miamiherald.com,mid-day.com,mlive.com,mnimarkets.com,modernhealthcare.com,modernretail.co,motorsportmagazine.com,mwatch.djmedia.djservices.io,nation.africa,nationalgeographic.com,nationalmortgagenews.com,nationalreview.com,nature.com,nautil.us,ndtvprofit.com,newcastleherald.com.au,newcriterion.com,newrepublic.com,news-press.com,newscientist.com,newsday.com,newslaundry.com,newsobserver.com,newstatesman.com,newsweek.com,newyorker.com,nhregister.com,niagarafallsreview.ca,nj.com,nola.com,northerndailyleader.com.au,northjersey.com,ntnews.com.au,nv.ua,nwitimes.com,nybooks.com,nydailynews.com,nymag.com,nypost.com,nypost.nypost.djservices.io,nysun.com,nytimes.com,nzherald.co.nz,observer.co.uk,ocregister.com,oklahoman.com,omaha.com,on3.com,oprahdaily.com,oregonlive.com,orlandosentinel.com,outlookbusiness.com,outlookindia.com,outsideonline.com,oxygenmag.com,palmbeachpost.com,pennlive.com,philanthropy.com,philonomist.com,pilotonline.com,pionline.com,plasticsnews.com,popularmechanics.com,precisionmedicineonline.com,pressenterprise.com,prevention.com,project-syndicate.org,puck.news,readmedium.com,rechargenews.com,reuters.com,reviewjournal.com,richmond.com,roadandtrack.com,rollingstone.com,rotowire.com,rubbernews.com,rugbypass.com,runnersworld.com,sacbee.com,sandiegouniontribune.com,scholastic.com,science.org,scientificamerican.com,scmp.com,scotsman.com,seattletimes.com,sfchronicle.com,sfstandard.com,shreveportbossieradvocate.com,silive.com,skimag.com,slate.com,slideshare.net,sloanreview.mit.edu,sltrib.com,smartcompany.com.au,smh.com.au,sofrep.com,sourcingjournal.com,spglobal.com,sportico.com,springfieldnewssun.com,standard.net.au,standardmedia.co.ke,star-telegram.com,staradvertiser.com,startribune.com,statesman.com,static.ffx.io,statnews.com,stcatharinesstandard.ca,stereogum.com,stltoday.com,stocknews.com,straitstimes.com,stratfor.com,study.com,stylist.co.uk,sun-sentinel.com,swarajyamag.com,syracuse.com,techinasia.com,techtarget.com,telegraph.co.uk,tennessean.com,tes.com,the-american-interest.com,the-scientist.com,the-tls.com,theadvocate.com,theadvocate.com.au,theage.com.au,theamericanconservative.com,theamericanscholar.org,theatlantic.com,theaustralian.com.au,thebanner.com,thebulletin.org,thechronicle.com.au,thecourier.com.au,thecut.com,thedailybeast.com,thediplomat.com,thedispatch.com,theglobeandmail.com,thehill.com,thehindu.com,thehindubusinessline.com,theinformation.com,thejuggernaut.com,thelampmagazine.com,thelawyer.com,theleaflet.in,thelogic.co,themandarin.com.au,themarker.com,themercury.com.au,thenewatlantis.com,thenewslens.com,thenewsminute.com,thenewworld.co.uk,thepeterboroughexaminer.com,thepointmag.com,thequint.com,therecord.com,thesaturdaypaper.com.au,thescottishsun.co.uk,thespec.com,thestage.co.uk,thestar.com,thestate.com,thesun.co.uk,thetimes.com,theweek.com,thewest.com.au,thewrap.com,thisismoney.co.uk,timeshighereducation.com,timesunion.com,tirebusiness.com,tomshardware.com,towardsdatascience.com,townandcountrymag.com,townsvillebulletin.com.au,tradewindsnews.com,trailrunnermag.com,tri-cityherald.com,triathlete.com,tucson.com,tulsaworld.com,twincities.com,unherd.com,upstreamonline.com,utech-polyurethane.com,uxdesign.cc,vanityfair.com,variety.com,vegetariantimes.com,vice.com,vikatan.com,vogue.co.uk,vogue.com,voguebusiness.com,vox.com,vulture.com,warontherocks.com,washingtonexaminer.com,washingtonpost.com,watoday.com.au,weeklytimesnow.com.au,wellandtribune.ca,westernadvocate.com.au,winnipegfreepress.com,wired.com,womenshealthmag.com,womensrunning.com,worldeconomics.com,wsj.com,wwd.com,ynet.co.il,yogajournal.com,yorkshirepost.co.uk##+js(user-bypass-paywalls.js)
```

## Clean TikTok

### Setup

Scriptlet:

```txt
user-clean-tiktok.js
```

Custom filter:

```js
tiktok.com##+js(user-clean-tiktok.js)
```

## DeArrow Titles YouTube

### Setup

Scriptlet:

```txt
user-dearrow-titles-youtube.js
```

Custom filter:

```js
youtube.com##+js(user-dearrow-titles-youtube.js)
```

## Hide Nav Bars

### Setup

Scriptlet:

```txt
user-hide-nav-bars.js
```

Custom filter:

```js
x.com,youtube.com##+js(user-hide-nav-bars.js)
```

## Location Blocking X

### Setup

Scriptlet:

```txt
user-location-blocking-x.js
```

Custom filter:

```js
x.com##+js(user-location-blocking-x.js)
```

## Redirect Google Maps

### Setup

Scriptlet:

```txt
user-redirect-google-maps.js
```

Custom filter:

```js
google.com##+js(user-redirect-google-maps.js)
```

## Redirect Imgur

### Setup

Scriptlet:

```txt
user-redirect-imgur.js
```

Custom filter:

```js
imgur.com##+js(user-redirect-imgur.js)
```

## Redirect Instagram

### Setup

Scriptlet:

```txt
user-redirect-instagram.js
```

Custom filter:

```js
instagram.com##+js(user-redirect-instagram.js)
```

## Redirect X

### Setup

Scriptlet:

```txt
user-redirect-x.js
```

Custom filter:

```js
x.com##+js(user-redirect-x.js)
```

## Return YouTube Dislikes

### Setup

Scriptlet:

```txt
user-dislikes-youtube.js
```

Custom filter:

```js
youtube.com##+js(user-dislikes-youtube.js)
```

## SponsorBlock YouTube

### Setup

Scriptlet:

```txt
user-sponsorblock-youtube.js
```

Custom filter:

```js
youtube.com##+js(user-sponsorblock-youtube.js)
```

## License

This repository is licensed under the MIT License.
