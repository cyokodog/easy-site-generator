var _ = require('underscore');
var fs = require('fs-extra');
var ejs = require('ejs');
var yaml = require('yamljs');
var marked = require('marked');


var settings = yaml.load(__dirname + '/settings.yml');
var doc_settings = settings.doc_settings;

// データ生成
var db = {};

for(var docType in doc_settings){

  var themeHtml = fs.readFileSync(__dirname + doc_settings[docType].themeFilePath, 'utf-8');
  var docs = [];
  var resource = yaml.load(__dirname + doc_settings[docType].draftsPath + '/' + settings.doc.indexFile);
  resource.forEach(function(item, index){
    var doc = _.assign({}, item);
    doc.slug = item.slug || item.file.replace(/(.+)\.md/, '$1');
    doc.publicFile = doc.slug + '.html';
    doc.url = doc_settings[docType].publicPath + '/' + doc.publicFile;
    doc.themeHtml = item.themeFilePath ? fs.readFileSync(__dirname + item.themeFilePath, 'utf-8') : themeHtml;

    if(item.file){
      doc.contentMarkdown = fs.readFileSync(__dirname + doc_settings[docType].draftsPath + '/' + item.file, 'utf-8');
      doc.content = marked(doc.contentMarkdown);
    }

    doc.refdocs = [];
    docs.push(doc);
  });

  db[docType] = {
    docs: docs,
    doc_setting: doc_settings[docType],
    resource: resource
  };
}

// カテゴリと URL のひも付け
_.each(db, function(item, docType){
  var categoryDoc = item.doc_setting.categoryDoc;
  if(categoryDoc){
    item.category = {};
    item.docs.forEach(function(doc, index){
      item.category[doc.slug] = doc;
    });
    db[categoryDoc.doc].docs.forEach(function(doc, index){
      var slug = doc[categoryDoc.key];
      if(slug){
        doc[categoryDoc.key + 'Url'] = item.category[slug].url;
        doc[categoryDoc.key + 'Title'] = item.category[slug].title;
        item.category[slug].refdocs.push(doc);
      }
    });

  }
});


// HTML ファイル生成
fs.removeSync(__dirname + '/private/*.html');
_.each(db, function(item, docType){
  var privatePath = __dirname + '/private';
  if(item.doc_setting.publicPath){
    privatePath = privatePath + item.doc_setting.publicPath;
    fs.removeSync(privatePath);
    fs.mkdirsSync(privatePath);
  }
  else {
    fs.removeSync(privatePath + '/*.html');
  }
  item.docs.forEach(function(doc, index){
    var param = _.assign({}, db, {
      doc: doc,
      include : function(filePath){
        var html = fs.readFileSync(__dirname + '/theme/' + filePath, 'utf-8')
        return ejs.render(html, this);
      }
    });
    var docHtml = ejs.render(doc.themeHtml, param);
    fs.writeFileSync(privatePath + '/' + doc.publicFile, docHtml, { encoding: 'utf8' });
  });
});

