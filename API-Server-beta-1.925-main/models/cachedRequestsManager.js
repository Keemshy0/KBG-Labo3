import * as utilities from "../utilities.js";
import * as serverVariables from "../serverVariables.js";

let cachesExpirationTime = serverVariables.get("main.cache.CacheExpirationTime");

// Repository file data models cache
global.caches = [];
global.cachedCleanerStarted = false;

export default class CachedRequestsManager {
    static startCachedRequestsCleaner() {/* démarre le processus de nettoyage des caches périmées */
        setInterval(CachedRequestsManager.flushExpired, cachesExpirationTime * 1000);
        console.log(BgWhite + FgBlue, "[Periodic content caches cleaning process started...]");
    }
    static add(url, content, ETag = "") {/* mise en cache */
        if (!cachedCleanerStarted) {
            cachedCleanerStarted = true;
            CachedRequestsManager.startCachedRequestsCleaner();
        }
        if (url != "") {
            CachedRequestsManager.clear(url);
            caches.push({
                url,
                content,
                ETag,
                Expire_Time: utilities.nowInSeconds() + cachesExpirationTime
            });
            console.log(BgWhite + FgBlue, `[Content of ${url} has been cached]`);
        }
    }
    static find(url) {/* retourne la cache associée à l'url */
        try {
            if (url != "") {
                for (let cache of caches) {
                    if (cache.url == url) {
                        // renew cache
                        cache.Expire_Time = utilities.nowInSeconds() + cachesExpirationTime;
                        console.log(BgWhite + FgBlue, `[${cache.url} content retrieved from cache]`);
                        return cache.content;
                    }
                }
            }
        } catch (error) {
            console.log(BgWhite + FgRed, "[cache error!]", error);
        }
        return null;
    }
    static clear(url) {/* efface la cache associée à l’url */
        if (url != "") {
            caches.forEach((cache, index) => {
                if (cache.url == url) utilities.deleteByIndex(caches, index);
            });
        }
    }
    static flushExpired() {/* efface les caches expirées */
        let now = utilities.nowInSeconds();
        for (let cache of caches) {
            if (cache.Expire_Time <= now) {
                console.log(BgWhite + FgBlue, "Cached file content of " + cache.url + ".json expired");
            }
        }
        caches = caches.filter(cache => cache.Expire_Time > now);
    }
    static get(HttpContext) {
        /*Chercher la cache correspondant à l'url de la requête. Si trouvé, envoyer la réponse avec
        HttpContext.response.JSON( content, ETag, true // from cache)*/
        if (HttpContext != "") {
            for (let cache of caches) {
                if(CachedRequestsManager.find(HttpContext.req.url)){
                    this.HttpContext.response.JSON( cache.content, cache.ETag, true)
                }
            }
        }
    }
}