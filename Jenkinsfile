pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = 'host.docker.internal:8082'

        DOCKER_IMAGE_BACKEND = "${DOCKER_REGISTRY}/rabta-backend"
        DOCKER_IMAGE_FRONTEND = "${DOCKER_REGISTRY}/rabta-frontend"

    }

    stages {

        stage('Checkout') {
            steps {
                

                echo "================================"
                echo "Branch: ${env.BRANCH_NAME}"
                echo "Build: ${env.BUILD_NUMBER}"
                echo "================================"
            }
        }

        stage('Tests') {
            parallel {

                stage('Backend Tests') {
                    steps {
                        dir('backend') {
                            sh 'npm install'
                            sh 'npm test'
                        }
                    }
                }

                stage('Frontend Tests') {
                    steps {
                        dir('frontend') {
                            sh 'npm install --legacy-peer-deps'
                            sh 'npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event --legacy-peer-deps'
                            sh 'npm run test:ci'
                        }
                    }
                }
            }
        }

        
        stage('Code Quality') {
            parallel {
                stage('SonarQube Backend') {
                    steps {
                        dir('backend') {
                            script {
                                def scannerHome = tool 'sonarqube-token'
                                withSonarQubeEnv('SonarQube') {
                                    sh "${scannerHome}/bin/sonar-scanner"
                                }
                            }
                        }
                    }
                }
                stage('SonarQube Frontend') {
                    steps {
                        dir('frontend') {
                            script {
                                def scannerHome = tool 'sonarqube-token'
                                withSonarQubeEnv('SonarQube') {
                                    sh "${scannerHome}/bin/sonar-scanner"
                                }
                            }
                        }
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }



        stage('Build Docker Images') {
            parallel {

                stage('Build Backend Image') {
                    steps {
                        script {
                            docker.build(
                                "${DOCKER_IMAGE_BACKEND}:${BUILD_NUMBER}",
                                "./backend"
                            )
                        }
                    }
                }

                stage('Build Frontend Image') {
                    steps {
                        script {
                            docker.build(
                                "${DOCKER_IMAGE_FRONTEND}:${BUILD_NUMBER}",
                                "./frontend"
                            )
                        }
                    }
                }
            }
        }

        stage('Push Docker Images') {
            when {
                anyOf {
                    branch 'main'
                    branch 'master'
                }
            }

            steps {
                script {
                    withCredentials([usernamePassword(
                        credentialsId: 'nexus-docker-creds',
                        usernameVariable: 'DOCKER_USERNAME',
                        passwordVariable: 'DOCKER_PASSWORD'
                    )]) {
                        sh """
                            echo \$DOCKER_PASSWORD | docker login -u \$DOCKER_USERNAME --password-stdin ${DOCKER_REGISTRY}
                            docker push ${DOCKER_IMAGE_BACKEND}:${BUILD_NUMBER}
                            docker push ${DOCKER_IMAGE_FRONTEND}:${BUILD_NUMBER}
                            docker tag ${DOCKER_IMAGE_BACKEND}:${BUILD_NUMBER} ${DOCKER_IMAGE_BACKEND}:latest
                            docker tag ${DOCKER_IMAGE_FRONTEND}:${BUILD_NUMBER} ${DOCKER_IMAGE_FRONTEND}:latest
                            docker push ${DOCKER_IMAGE_BACKEND}:latest
                            docker push ${DOCKER_IMAGE_FRONTEND}:latest
                            docker logout ${DOCKER_REGISTRY}
                        """
                    }
                    
                }
            }
        }

        stage('Deploy') {
            when {
                anyOf {
                    branch 'main'
                    branch 'master'
                }
            }

            steps {
                sh '''
                    docker compose down
                    docker compose up -d
                '''
            }
        }

        stage('Health Check') {
            when {
                anyOf {
                    branch 'main'
                    branch 'master'
                }
            }

            steps {
                script {

                    retry(5) {

                        sleep(time: 10, unit: 'SECONDS')

                        sh '''
                          curl -f http://host.docker.internal:3001
                        '''
                    }
                }
            }
        }
    }

    post {

        success {
            echo "================================"
            echo "CI/CD PIPELINE SUCCESS"
            echo "Application deployed successfully."
            echo "================================"
        }

        failure {
            echo "================================"
            echo "CI/CD PIPELINE FAILED"
            echo "Check the Jenkins logs."
            echo "================================"
        }
    }
}