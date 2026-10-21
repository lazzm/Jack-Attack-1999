/* the tab is always "Jack Attack 1999": pages that set document.title keep their own name internally, the tab never changes */
(function () { var t; try { Object.defineProperty(document, 'title', { configurable: true, get: function () { return t == null ? 'Jack Attack 1999' : t; }, set: function (v) { t = String(v); } }); } catch (e) {} })();
