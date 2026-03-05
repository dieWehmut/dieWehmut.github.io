package dto

type PageItem struct {
	Name        string `json:"name"`
	DisplayName string `json:"displayName"`
	RepoURL     string `json:"repoUrl"`
	Date        string `json:"date"`
	URL         string `json:"url"`
}

