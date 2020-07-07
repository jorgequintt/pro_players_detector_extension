chrome.storage.local.get(["options"], (st) => {
   if (!("options" in st) || !st.options || !("enableExt" in st.options)) {
      chrome.storage.local.set({options: {...st.options, enableExt: true}});
   }
});