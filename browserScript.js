// ==UserScript==
// @name         send post req form linkedin
// @namespace    http://tampermonkey.net/
// @version      2023-12-19
// @description  send request from linked in
// @author       You
// @match        *://www.linkedin.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addElement
// @connect      localhost
// ==/UserScript==

(function () {
  /* eslint-disable no-undef */
  /* eslint-disable no-unused-vars */
  'use strict'
  const PORT = 3212

  const maInputs = []

  const baInputs = []

  const popUpWindow = GM_addElement(document.body, 'div', {
    style: 'position:fixed; z-index:99999; top:10px; left:50%; transform:translate(-50%,0); background-color:white',
    class: 'tampermonkey-popUpWindow'
  })
  const maInputsContainer = GM_addElement(popUpWindow, 'div', {
    class: 'tampermonkey-maInputsContainer'
  })
  const addMaInputButton = GM_addElement(popUpWindow, 'button', {
    class: 'tampermonkey-addInputButton',
    textContent: 'add MA input item'
  })
  const deleteMaInputButton = GM_addElement(popUpWindow, 'button', {
    class: 'tampermonkey-deleteInputButton',
    textContent: 'delete MA input item'
  })
  const baInputsContainer = GM_addElement(popUpWindow, 'div', {
    class: 'tampermonkey-baInputsContainer'
  })
  const addBaInputButton = GM_addElement(popUpWindow, 'button', {
    class: 'tampermonkey-addInputButton',
    textContent: 'add BA input item'
  })
  const deleteBaInputButton = GM_addElement(popUpWindow, 'button', {
    class: 'tampermonkey-deleteInputButton',
    textContent: 'delete BA input item'
  })

  addBaInputButton.addEventListener('click', () => {
    addSchoolInput('ba')
  })
  deleteBaInputButton.addEventListener('click', () => {
    rmSchoolInput('ba')
  })
  addMaInputButton.addEventListener('click', () => {
    addSchoolInput('ma')
  })
  deleteMaInputButton.addEventListener('click', () => {
    rmSchoolInput('ma')
  })

  function addSchoolInput (schoolType, defaultUrlVal) {
    const [schoolInputsArray, deleteButton, containerElem] = schoolType.toLowerCase() === 'ma'
      ? [maInputs, deleteMaInputButton, maInputsContainer]
      : schoolType.toLowerCase() === 'ba'
        ? [baInputs, deleteBaInputButton, baInputsContainer]
        : undefined

    if (schoolInputsArray === undefined) throw new Error('input could not be added, wrong school type!')

    const schoolInputContainer = GM_addElement(containerElem, 'div', {
      class: 'tampermonkey-inputContainer',
      id: `tampermonkey-${schoolType}InputContainer${schoolInputsArray.length}`
    })
    const schoolUrlInput = GM_addElement(schoolInputContainer, 'input', {
      class: 'tampermonkey-inputUrl',
      id: `tampermonkey-${schoolType}InputUrl${schoolInputsArray.length}`,
      placeholder: `url of school of ${schoolType} degree ${schoolInputsArray.length + 1}`,
      value: defaultUrlVal
    })
    const degreeTitleExcerptInput = GM_addElement(schoolInputContainer, 'input', {
      class: 'tampermonkey-inputExcerpt',
      id: `tampermonkey-${schoolType}InputUrl${schoolInputsArray.length}`,
      placeholder: `excerpt of title of ${schoolType} degree ${schoolInputsArray.length + 1}`
    })
    const degreeTitleGradYear = GM_addElement(schoolInputContainer, 'input', {
      type: 'text',
      class: 'tampermonkey-inputGradYear',
      id: `tampermonkey-${schoolType}InputGradYear${schoolInputsArray.length}`,
      placeholder: `Graduation Year of ${schoolType} degree ${schoolInputsArray.length + 1}`,
      maxlength: '4',
      style: 'width:8ch; height:auto',
      title: `Graduation Year of ${schoolType} degree ${schoolInputsArray.length + 1}`
    })
    schoolInputsArray.push(schoolInputContainer)
    updateDeleteButtonState(deleteButton, schoolInputsArray)
  }

  function rmSchoolInput (schoolType) {
    const [schoolInputsArray, deleteButton] = schoolType.toLowerCase() === 'ma'
      ? [maInputs, deleteMaInputButton]
      : schoolType.toLowerCase() === 'ba'
        ? [baInputs, deleteBaInputButton]
        : undefined

    if (schoolInputsArray === undefined) throw new Error('input could not be removed, wrong school type!')

    if (schoolInputsArray.length === 1) {
      console.log('cannot remove input item, only 1 left')
      return
    }
    const lastElemInArray = schoolInputsArray.pop()
    lastElemInArray.remove()
    updateDeleteButtonState(deleteButton, schoolInputsArray)
  }

  function updateDeleteButtonState (button, inputItems) {
    button.disabled = inputItems.length <= 1
  }

  addSchoolInput('ba')
  addSchoolInput('ma', 'https://www.linkedin.com/company/4081/')

  // const input = GM_addElement(maInputsContainer,"input",{
  // type:"text",
  // })
  const phdCheckbox = GM_addElement(popUpWindow, 'input', {
    type: 'checkbox', value: 'phd', id: 'scraper_phd_checkbox'
  })
  const phdLabel = GM_addElement(popUpWindow, 'label', {
    for: 'scraper_phd_checkbox', textContent: 'phd?'
  })
  const submitButton = GM_addElement(popUpWindow, 'button', {
    type: 'text',
    textContent: 'submit',
    style: 'border: solid black 1px'
  })

  const infoBox = GM_addElement(popUpWindow, 'div', {
    style: 'border: solid blue 1px'
  })

  const defaultFadeoutTime = 9000

  function showMessageAndFadeOut (element, msg, timeoutTime = defaultFadeoutTime) {
    if (typeof msg !== 'string') {
      console.error('msg is not typeof string', msg)
      return
    }
    const msgElement = GM_addElement(element, 'span', {})
    msgElement.innerHTML = msg
    setTimeout(() => {
      element.removeChild(msgElement)
    }, timeoutTime)
  }
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`
  // TODO: i made school inputs add/remove/-able
  // now i need to collect them and send them to backend in some legible fashion...
  // change postPersonId fn
  // if both url and except values in item are '', ignore it all together.
  // if only url - that's okay then it means we search first in default order
  // if only excerpt is there - do not send ??? ask for url ??
  // if school cannot be found by url, return a message that asks for manual entry

  document.addEventListener('keydown', function (event) {
  // Check if the event occurred with the Ctrl key pressed
    if (event.ctrlKey) {
    // Check if the Enter key is pressed (key code 13)
      if (event.key === 'Enter' || event.keyCode === 13) {
      // Your code to handle the Ctrl + Enter hotkey
        console.log('Ctrl + Enter pressed')
        // Add your logic here
        postPersonId(window.location.pathname)
      }
    }
  })

  submitButton.addEventListener('click', () => { postPersonId(window.location.pathname) })

  function postPersonId (profileUrlPathname) {
    const maSelectors = collectSchoolSelectors(maInputs, 'ma')
    const baSelectors = collectSchoolSelectors(baInputs, 'ba')
    const schoolsSelectors = { maSelectors, baSelectors }
    const phd = phdCheckbox.checked
    const endpoint = `http://localhost:${PORT}/parse-url`
    const payload = { profileUrlPathname, schoolsSelectors, phd }
    console.log('sending post req', payload)
    GM_xmlhttpRequest({
      method: 'POST',
      data: JSON.stringify(payload),
      url: `http://localhost:${PORT}/parse-url`,
      headers: {
        'Content-Type': 'text/plain'
      },
      onload: function (res) {
        console.log(res)
        console.log(res.responseText)
        showMessageAndFadeOut(infoBox, res.responseText)
      }
    })
  }

  /**
 * Description
 * @param {Array} schoolInputsArr
 * @param {('ma'|'ba')} schoolType
 * @returns {Array<import("./server/typedefs").SchoolSelectors>} school Selectors
 */
  function collectSchoolSelectors (schoolInputsArr, schoolType) {
    schoolType = schoolType.toLowerCase()
    if (!(schoolType === 'ba' || schoolType === 'ma')) throw new Error('wrong school type, needs to be either "ma" or "ba" ')
    const schoolSelectors = []
    schoolInputsArr.forEach((container, i) => {
      const inputUrl = container.querySelector('.tampermonkey-inputUrl')
      const inputExcerpt = container.querySelector('.tampermonkey-inputExcerpt')
      const inputGradYear = container.querySelector('.tampermonkey-inputGradYear')
      const urlValue = inputUrl.value
      const excerptValue = inputExcerpt.value
      const gradYearValue = +inputGradYear.value

      if (!urlValue && !excerptValue) {
        showMessageAndFadeOut(infoBox, `inputs of field ${i + 1} for ${schoolType} schools are empty, skipping}`)
        console.warn(`{inputs of field ${i + 1} for ${schoolType} schools are empty, skipping}`)
        return
      } else if (!urlValue) {
        showMessageAndFadeOut(infoBox, `field ${i + 1} for ${schoolType} : can't post field without url`)
        throw new Error(`field ${i + 1} for ${schoolType} : can't post field without url`)
      }

      if (gradYearValue !== 0 && (isNaN(gradYearValue) || (gradYearValue + '').length !== 4)) {
        const gradYearError = `field ${i + 1} for ${schoolType} : year should be a for digit number`
        showMessageAndFadeOut(infoBox, gradYearError)
        throw new Error(gradYearError)
      }
      schoolSelectors.push({ url: urlValue, degreeTitleExcerpt: excerptValue, ...(gradYearValue !== 0 ? { gradYear: gradYearValue } : undefined) })
    })
    return schoolSelectors
  }

  console.log('user script loaded')
})()
