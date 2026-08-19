pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = 'docker.io'

        DOCKER_IMAGE_BACKEND = 'fatimzahraebouarafa/rabta-backend'
        DOCKER_IMAGE_FRONTEND = 'fatimzahraebouarafa/rabta-frontend'

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
                        echo 'No backend tests configured yet.'
                    }
                }

                stage('Frontend Tests') {
                    steps {
                        echo 'No frontend tests configured yet.'
                    }
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
                        credentialsId: 'docker-registry-credentials',
                        usernameVariable: 'DOCKER_USERNAME',
                        passwordVariable: 'DOCKER_PASSWORD'
                    )]) {
                        sh """
                            echo \$DOCKER_PASSWORD | docker login -u \$DOCKER_USERNAME --password-stdin docker.io
                            docker push ${DOCKER_IMAGE_BACKEND}:${BUILD_NUMBER}
                            docker push ${DOCKER_IMAGE_FRONTEND}:${BUILD_NUMBER}
                            docker tag ${DOCKER_IMAGE_BACKEND}:${BUILD_NUMBER} ${DOCKER_IMAGE_BACKEND}:latest
                            docker tag ${DOCKER_IMAGE_FRONTEND}:${BUILD_NUMBER} ${DOCKER_IMAGE_FRONTEND}:latest
                            docker push ${DOCKER_IMAGE_BACKEND}:latest
                            docker push ${DOCKER_IMAGE_FRONTEND}:latest
                            docker logout docker.io
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
                            curl -f http://localhost:3001
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