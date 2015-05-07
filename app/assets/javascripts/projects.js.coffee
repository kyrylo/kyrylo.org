$ ->
  nextInt = (elem) ->
    labels = elem.siblings('label')
    attr = labels.last()[0].getAttribute('for').match(/\d+/)
    if attr
      strI = [0]
      parseInt(strI) + 1
    else
      0

  createLabel = (i, name) ->
    label = document.createElement('label')
    forAttr = document.createAttribute('for')
    forAttr.value = "project_project_links_attributes_#{i}_#{name}"
    label.setAttributeNode(forAttr)
    labelContent = document.createTextNode(name);
    label.appendChild(labelContent)
    label

  createInput = (i, name) ->
    input = document.createElement('input')
    typeAttr = document.createAttribute('type')
    typeAttr.value = 'text'
    input.setAttributeNode(typeAttr)
    nameAttr = document.createAttribute('name')
    nameAttr.value = "project[project_links_attributes][#{i}][#{name}]"
    input.setAttributeNode(nameAttr)
    idAttr = document.createAttribute('id')
    idAttr.value = "project_project_links_attributes_#{i}_#{name}"
    input.setAttributeNode(idAttr)
    input

  $('#add-link').click ->
    docfrag = document.createDocumentFragment()

    i = nextInt($(this))

    docfrag.appendChild(createLabel(i, 'Name:'))
    docfrag.appendChild(createInput(i, 'name'))

    docfrag.appendChild(createLabel(i, 'Href:'))
    docfrag.appendChild(createInput(i, 'href'))

    br = document.createElement('br')
    docfrag.appendChild(br)

    $(this).before(docfrag)
