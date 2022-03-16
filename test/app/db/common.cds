aspect customManaged {

  SourceSystem : String(255)

}


annotate customManaged with {
  SourceSystem @cds.changelog.enabled;
};
