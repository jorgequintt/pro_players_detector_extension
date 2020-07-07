(function () {
   $(document).ready(() => {
      console.log(chrome.extension.getURL('assets/icons/128.png'));
      $('img.ext-logo').attr('src', chrome.extension.getURL('assets/icons/128.png'));

      chrome.storage.local.get(['options'], (st) => {
         if (!!st.options) {
            if (("displayBar" in st.options)) {
               document.querySelector('#displayBar').checked = st.options.displayBar;
            }
            if (("enableExt" in st.options)) {
               document.querySelector('#enableExt').checked = st.options.enableExt;
            }
         }
      });

      $('body').on('click', '#displayBar', () => {
         chrome.storage.local.get(["options"], (st) => {
            chrome.storage.local.set({ options: {...st.options, displayBar: document.querySelector('#displayBar').checked } });
         });
      });
      $('body').on('click', '#enableExt', () => {
         chrome.storage.local.get(["options"], (st) => {
            chrome.storage.local.set({ options: { ...st.options, enableExt: document.querySelector('#enableExt').checked } });
         });
      });
   });
})();