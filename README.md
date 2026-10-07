# Lite Scripts

Lightweight userscripts for common video, social-media, navigation, and reading-site tasks. The collection is intended for userscript managers and, where compatible, Brave Browser custom scriptlets.

The `.user.js` files are the canonical versions in this repository. They can be installed with userscript managers such as Tampermonkey, Violentmonkey, or Greasemonkey. Brave Browser is also supported for the scripts listed in the **Brave Custom Scriptlets** section.

> [!WARNING]
> Always review third-party code before executing it in your browser environment.

## Usage

### Userscript managers

Install the corresponding `.user.js` file in your userscript manager. Keep the userscript metadata block at the top of each file so the manager can identify its name, matching sites, execution timing, and permissions.

### Minified userscripts

All userscripts in **Lite Scripts** are distributed in minified form. Minification removes unnecessary whitespace and comments and, where appropriate, compacts internal code so the installed scripts stay small and lightweight. This reduces file size and repository clutter and can marginally reduce download and parsing overhead; it is not intended to change script behavior or act as obfuscation.

Userscript metadata and deliberately user-editable configuration, such as the `USER_CONFIG` block in **X-Posed Lite**, remain readable where needed.

## Included userscripts

| File | Purpose | Adapted from |
| --- | --- | --- |
| `Bypass Paywalls Lite.user.js` | Removes or works around paywall barriers on supported sites. | [Bypass Paywalls Clean Filters](https://gitflic.ru/project/magnolia1234/bypass-paywalls-clean-filters) |
| `Hide Navigation Bars.user.js` | Automatically hides detected fixed or sticky navigation bars after a small scroll on supported sites, while leaving excluded video pages alone. Intended primarily for mobile browsers. | — |
| `PIP & Background Playback.user.js` | Restores YouTube background playback and improves native Picture-in-Picture handling on supported browsers and devices. | — |
| `Redirect Google Maps.user.js` | Opens coordinate-based Google Maps links in Apple Maps. | — |
| `Redirect Instagram.user.js` | Redirects Instagram pages to Imginn. | — |
| `TikTok URL Cleaner.user.js` | Removes TikTok URL query parameters for cleaner links. | — |
| `X-Posed Lite.user.js` | Displays X account-location indicators and optionally filters posts by account location. | [x-account-location-device](https://github.com/xaitax/x-account-location-device) |
| `YouTube DeArrow Titles Lite.user.js` | Replaces YouTube titles with community-sourced DeArrow titles. | [DeArrow](https://github.com/ajayyy/DeArrow) |
| `YouTube Return Dislikes Lite.user.js` | Restores YouTube dislike counts. | [Return YouTube Dislike userscript](https://github.com/Anarios/return-youtube-dislike/raw/main/Extensions/UserScript/Return%20Youtube%20Dislike.user.js) |
| `YouTube Sponsorblock Lite.user.js` | Automatically skips configured SponsorBlock segments in YouTube videos. | [sb.js](https://github.com/mchangrh/sb.js) |

### X-Posed Lite preferences

`X-Posed Lite.user.js` has optional settings near the top of the script:

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
- `COMMUNITY_CACHE` — when `true`, checks the shared community cache first for account-location data. If no cached result is available, the script can fall back to X's API according to `REQUIRE_INTERACTION`.
- `REQUIRE_INTERACTION` — when `true`, direct X API lookups require clicking the question-mark indicator; community-cache lookups can still run automatically. When `false`, missing locations can also be fetched automatically from X.

The community cache uses `GM_xmlhttpRequest`, so it requires a userscript manager that provides that API. Brave custom scriptlets do not provide it; when X-Posed Lite is used as a Brave scriptlet, community-cache lookups are unavailable.

# Brave Custom Scriptlets

Brave's custom-scriptlet system uses the minified script body without the userscript metadata block. Open `brave://settings/shields/filters/`, add the relevant scripts with the exact filenames below, then paste the filter block into **Create Custom Filters**.

Scriptlet filenames used by the current filter:

```txt
user-redirect-google-maps.js
user-redirect-instagram.js
user-tiktok-url-cleaner.js
user-youtube-dearrow-titles-lite.js
user-youtube-return-dislikes-lite.js
user-youtube-sponsorblock-lite.js
user-x-posed-lite.js
user-bypass-paywalls-lite.js
```

`Hide Navigation Bars` and `PIP & Background Playback` are not part of the filter block below.

### Custom filter

```txt
! Scriptlets\
google.com##+js(user-redirect-google-maps.js)\
instagram.com##+js(user-redirect-instagram.js)\
tiktok.com##+js(user-tiktok-url-cleaner.js)\
youtube.com##+js(user-youtube-dearrow-titles-lite.js)\
youtube.com##+js(user-youtube-return-dislikes-lite.js)\
youtube.com##+js(user-youtube-sponsorblock-lite.js)\
x.com##+js(user-x-posed-lite.js)\
360dx.com,abqjournal.com,accountingtoday.com,adage.com,adelaidenow.com.au,adn.com,adweek.com,afr.com,ajc.com,al-monitor.com,al.com,americanbanker.com,anandabazar.com,architecturaldigest.com,artnet.com,asia.nikkei.com,autocar.co.uk,autonews.com,autosport.com,axios.com,azcentral.com,backpacker.com,balkaninsight.com,baltimoresun.com,bangkokpost.com,barandbench.com,belfasttelegraph.co.uk,bendigoadvertiser.com.au,benefitnews.com,benzinga.com,betamtb.com,betternutrition.com,betterprogramming.pub,bhaskar.com,bicycling.com,billboard.com,bizjournals.com,bloomberg.com,bloombergadria.com,bnd.com,bonappetit.com,bondbuyer.com,bordermail.com.au,bostonglobe.com,bostonherald.com,brisbanetimes.com.au,buffalonews.com,business-standard.com,businessdailyafrica.com,businessdesk.co.nz,businessinsider.com,businessinsider.jp,businessoffashion.com,businesspost.ie,businesstimes.com.sg,cairnspost.com.au,canberratimes.com.au,capitalgazette.com,caravanmagazine.in,centralwesterndaily.com.au,charlotteobserver.com,chicagobusiness.com,chicagotribune.com,chronicle.com,cincinnati.com,cleaneatingmag.com,cleveland.com,climbing.com,cnbc.com,cnn.com,cntraveler.com,codesports.com.au,columbian.com,commercialappeal.com,computerweekly.com,cosmopolitan.com,countryliving.com,courant.com,courier-journal.com,couriermail.com.au,crainscleveland.com,crainsdetroit.com,crainsgrandrapids.com,crainsnewyork.com,crikey.com.au,csmonitor.com,ctinsider.com,ctpost.com,curbed.com,cyclingnews.com,dailyadvertiser.com.au,dailyherald.com,dailyliberal.com.au,dailymail.com,dailypress.com,dailyrecord.co.uk,dailytelegraph.com.au,dallasnews.com,daytondailynews.com,decanter.com,deccanherald.com,defector.com,delish.com,democratandchronicle.com,denverpost.com,desmoinesregister.com,detroitnews.com,dig-in.com,digiday.com,discovermagazine.com,dispatch.com,dn.no,dwell.com,eastbaytimes.com,economictimes.com,economictimes.indiatimes.com,elle.com,elledecor.com,elnuevoherald.com,enotes.com,entrepreneur.com,epaper.indiatimes.com,epicurious.com,epoch.org.il,espn.com,esquire.com,euobserver.com,european-rubber-journal.com,europower.no,examiner.com.au,express.co.uk,expressnews.com,fastcompany.com,fieldandstream.com,financial-planning.com,financialexpress.com,firstthings.com,fiskeribladet.no,fmrmagazine.com,fnlondon.com,forbes.com,foreignaffairs.com,foreignpolicy.com,fortune.com,foxnews.com,freep.com,fresnobee.com,ft.com,ftm.eu,gbnews.com,geelongadvertiser.com.au,genomeweb.com,glossy.co,goldcoastbulletin.com.au,goodhousekeeping.com,gq.com,granta.com,grubstreet.com,haaretz.co.il,haaretz.com,harpers.org,harpersbazaar.com,hbr.org,heraldsun.com.au,hilltimes.com,hindustantimes.com,historyextra.com,historytoday.com,hotnews.ro,housebeautiful.com,houstonchronicle.com,hydrogeninsight.com,iai.tv,illawarramercury.com.au,inc.com,inc42.com,independent.ie,indianexpress.com,indiatoday.in,indystar.com,infzm.com,inkl.com,inquirer.com,insidehighered.com,insights.citeline.com,interestingengineering.com,intrafish.com,intrafish.no,investors.com,ipolitics.ca,irishexaminer.com,irishmirror.ie,jacksonville.com,japantimes.co.jp,jgnt.co,journal-news.com,journalnow.com,journalstar.com,jpost.com,jsonline.com,kansas.com,kansascity.com,kathimerini.gr,kentucky.com,knoxnews.com,kompas.id,kystens.no,latimes.com,lehighvalleylive.com,literaryreview.co.uk,livelaw.in,livemint.com,lrb.co.uk,macrobusiness.com.au,madison.com,magazine.atavist.com,manoramaonline.com,marketwatch.com,masslive.com,mcall.com,mcclatchydc.com,medium.com,medscape.com,menshealth.com,mercurynews.com,mexiconewsdaily.com,miamiherald.com,mid-day.com,mirror.co.uk,mlive.com,modernhealthcare.com,modernretail.co,motorsportmagazine.com,nation.africa,nationalgeographic.com,nationalmortgagenews.com,nationalreview.com,nature.com,nautil.us,ndtvprofit.com,newcastleherald.com.au,newcriterion.com,newrepublic.com,news-press.com,newscientist.com,newsday.com,newslaundry.com,newsobserver.com,newstatesman.com,newsweek.com,newyorker.com,nhregister.com,niagarafallsreview.ca,nj.com,nola.com,northerndailyleader.com.au,northjersey.com,ntnews.com.au,nwitimes.com,nybooks.com,nydailynews.com,nymag.com,nypost.com,nysun.com,nytimes.com,nzgeo.com,nzherald.co.nz,observer.co.uk,ocregister.com,ogj.com,oklahoman.com,omaha.com,oprahdaily.com,oregonlive.com,orlandosentinel.com,outlookbusiness.com,outlookindia.com,outsideonline.com,oxygenmag.com,palmbeachpost.com,pennlive.com,philanthropy.com,philonomist.com,pilotonline.com,pionline.com,plasticsnews.com,popularmechanics.com,precisionmedicineonline.com,pressenterprise.com,prevention.com,project-syndicate.org,puck.news,rechargenews.com,reuters.com,reviewjournal.com,richmond.com,roadandtrack.com,rollingstone.com,rotowire.com,rubbernews.com,rugbypass.com,runnersworld.com,sacbee.com,sandiegouniontribune.com,scholastic.com,science.org,scientificamerican.com,scmp.com,scotsman.com,seattletimes.com,sfchronicle.com,sfstandard.com,shreveportbossieradvocate.com,silive.com,skimag.com,slate.com,slideshare.net,sloanreview.mit.edu,smartcompany.com.au,smh.com.au,sofrep.com,sourcingjournal.com,spectator.com,spglobal.com,sportico.com,springfieldnewssun.com,standard.net.au,standardmedia.co.ke,star-telegram.com,staradvertiser.com,startribune.com,statesman.com,statnews.com,stcatharinesstandard.ca,stereogum.com,stltoday.com,stocknews.com,straitstimes.com,stratfor.com,study.com,sun-sentinel.com,swarajyamag.com,syracuse.com,techinasia.com,techtarget.com,telegraph.co.uk,tennessean.com,tes.com,the-american-interest.com,the-scientist.com,the-star.co.ke,the-tls.com,theadvocate.com,theadvocate.com.au,theage.com.au,theamericanconservative.com,theamericanscholar.org,theatlantic.com,theaustralian.com.au,thebanner.com,thebulletin.org,thechronicle.com.au,thecourier.com.au,thecut.com,thedailybeast.com,thediplomat.com,thedispatch.com,theglobeandmail.com,thehill.com,thehindu.com,thehindubusinessline.com,thejuggernaut.com,thelampmagazine.com,thelawyer.com,theleaflet.in,thelogic.co,themandarin.com.au,themarker.com,themercury.com.au,thenewatlantis.com,thenewslens.com,thenewsminute.com,thenewworld.co.uk,thepeterboroughexaminer.com,thepointmag.com,thequint.com,therecord.com,thesaturdaypaper.com.au,thescottishsun.co.uk,thespec.com,thestage.co.uk,thestar.com,thestate.com,thesun.co.uk,thesun.ie,thetimes.com,theweek.com,thewest.com.au,thewrap.com,thisismoney.co.uk,timeshighereducation.com,timesofindia.indiatimes.com,timesunion.com,tirebusiness.com,tomshardware.com,towardsdatascience.com,townandcountrymag.com,townsvillebulletin.com.au,tradewindsnews.com,trailrunnermag.com,tri-cityherald.com,triathlete.com,tucson.com,tulsaworld.com,twincities.com,unherd.com,upstreamonline.com,utech-polyurethane.com,uxdesign.cc,vanityfair.com,variety.com,vegetariantimes.com,vice.com,vikatan.com,vogue.co.uk,vogue.com,vox.com,vulture.com,warontherocks.com,washingtonexaminer.com,washingtonpost.com,watoday.com.au,weeklytimesnow.com.au,wellandtribune.ca,westernadvocate.com.au,winnipegfreepress.com,wired.com,womenshealthmag.com,womensrunning.com,worldeconomics.com,wsj.com,wwd.com,ynet.co.il,yogajournal.com,yorkshirepost.co.uk##+js(user-bypass-paywalls-lite.js)
```

## License

This repository is licensed under the MIT License.
