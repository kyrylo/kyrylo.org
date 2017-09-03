$(function() {
  var nextInt = function(elem) {
    var labels = elem.siblings('label'),
        attr = labels.last()[0].getAttribute('for').match(/\d+/);

    if (attr) {
      var strI = [0];
      return parseInt(strI) + 1;
    } else {
      return 0;
    }
  };

  var createLabel = function(i, name) {
    var label = document.createElement('label'),
        forAttr = document.createAttribute('for');

    forAttr.value = 'project_project_links_attributes_' + i + '_' + name;
    label.setAttributeNode(forAttr);
    var labelContent = document.createTextNode(name);
    label.appendChild(labelContent);
    return label;
  };

  var createInput = function(i, name) {
    var input = document.createElement('input'),
        typeAttr = document.createAttribute('type');

    typeAttr.value = 'text';
    input.setAttributeNode(typeAttr);

    var nameAttr = document.createAttribute('name');
    nameAttr.value = 'project[project_links_attributes][' + i + '][' + name + ']';
    input.setAttributeNode(nameAttr);

    var idAttr = document.createAttribute('id');
    idAttr.value = 'project_project_links_attributes_' + i + '_' + name;
    input.setAttributeNode(idAttr);

    return input;
  };

  $('#add-link').click(function() {
    var docfrag = document.createDocumentFragment(),
        i = nextInt($(this));

    docfrag.appendChild(createLabel(i, 'Name:'));
    docfrag.appendChild(createInput(i, 'name'));
    docfrag.appendChild(createLabel(i, 'Href:'));
    docfrag.appendChild(createInput(i, 'href'));

    var br = document.createElement('br');
    docfrag.appendChild(br);

    $(this).before(docfrag);
  });
});
