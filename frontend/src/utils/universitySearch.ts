// This file helps with university name search, including acronyms and abbreviations

// Define common university acronyms and abbreviations based on the new CSV list
export const universityAcronyms: {[key: string]: string} = {
    // UC System
    "UCLA": "University of California, Los Angeles",
    "UC Berkeley": "University of California, Berkeley",
    "Berkeley": "University of California, Berkeley",
    "UCB": "University of California, Berkeley",
    "UCSC": "University of California, Santa Cruz",
    "UC Santa Cruz": "University of California, Santa Cruz",
    
    // Other universities from CSV
    "UMich": "University of Michigan",
    "Michigan": "University of Michigan",
    "U of M": "University of Michigan",
    "UF": "University of Florida",
    "Florida": "University of Florida",
    "Stanford": "Stanford University",
    "NYU": "New York University",
    "PSU": "Penn State University",
    "Penn State": "Penn State University",
    "ASU": "Arizona State University"
  };
  
  // Function to enhance university search results with acronyms
  export const enhanceUniversitySearch = (
    searchTerm: string,
    allSchools: string[]
  ): string[] => {
    if (!searchTerm || !searchTerm.trim()) {
      return [];
    }
    
    const lowerSearchTerm = searchTerm.toLowerCase().trim();
    const results = new Set<string>();
    
    // Check for direct acronym matches first
    for (const [acronym, fullName] of Object.entries(universityAcronyms)) {
      if (acronym.toLowerCase() === lowerSearchTerm) {
        // If this is an exact acronym match and exists in our schools list, prioritize it
        if (allSchools.includes(fullName)) {
          results.add(fullName);
        }
      }
    }
    
    // Then check for acronym partial matches
    if (results.size < 5) {
      for (const [acronym, fullName] of Object.entries(universityAcronyms)) {
        if (acronym.toLowerCase().includes(lowerSearchTerm) || lowerSearchTerm.includes(acronym.toLowerCase())) {
          if (allSchools.includes(fullName) && !Array.from(results).includes(fullName)) {
            results.add(fullName);
            if (results.size >= 5) break;
          }
        }
      }
    }
    
    // Finally, check for normal school name matches
    if (results.size < 5) {
      for (const school of allSchools) {
        if (school.toLowerCase().includes(lowerSearchTerm)) {
          results.add(school);
          if (results.size >= 5) break;
        }
      }
    }
    
    return Array.from(results);
  };
  
  // Additional helper function to get the full university name from an acronym or partial name
  export const getFullUniversityName = (input: string, allSchools: string[]): string => {
    if (!input || !input.trim()) {
      return input;
    }
    
    const lowerInput = input.toLowerCase().trim();
    
    // Check for direct acronym match
    for (const [acronym, fullName] of Object.entries(universityAcronyms)) {
      if (acronym.toLowerCase() === lowerInput) {
        if (allSchools.includes(fullName)) {
          return fullName;
        }
      }
    }
    
    // If no match was found, return the original input
    return input;
  };