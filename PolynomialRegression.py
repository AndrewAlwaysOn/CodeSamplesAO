#This is a Polynomial Regression (PR) implementation in Python.
#In 1981, n = 78 bluegills were randomly sampled from Lake Mary in Minnesota. The researchers (Cook and Weisberg, 1999) measured and recorded the following data (Bluegills dataset)
#For this dataset I have done Polynomial Regression with R^2 scores
#I have split the data set into train and test sets
#Then I visualised the data on a chart and the PR as well as displayed the results.
#The results are promising: Train R^2=0.41 and Test R^2=0.38

import sys
import matplotlib
matplotlib.use('Agg')  # Use a non-GUI backend

import numpy
import matplotlib.pyplot as plt
from sklearn.metrics import r2_score
numpy.random.seed(2)

#age
x = [ 1,  2, 2, 2, 3, 3, 3,  3, 3, 2, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 4, 4, 5, 2, 2, 4, 3, 4, 3, 4, 4, 4, 4, 3, 3, 3, 4, 4, 3, 4, 5, 4, 5, 4, 4, 3, 5, 5, 4 ]

#height
y = [ 67, 62,  91, 88, 137, 131, 122,  143, 142, 123, 122, 138, 135, 146, 146, 145, 145, 144, 140, 150, 152, 157, 155, 153, 154, 158, 162, 161, 162, 165, 171, 171, 162, 169, 167, 188, 100, 109, 150, 140, 170, 150, 140, 140, 150, 150, 140, 150, 150, 150, 160, 140, 150, 170, 150, 150, 150, 150, 150]

#test data
xtest = [1, 2, 3, 3, 3, 3, 5, 3, 4, 3, 4, 6, 4, 5, 4, 4, 4, 5, 4, 4]
ytest = [109, 83, 122, 118, 115, 131, 150, 160, 140, 160, 130, 160, 130, 170, 170, 160, 180, 160, 170, 170 ] 

# Split the data into training and testing sets
train_x = x
train_y = y

test_x = xtest
test_y = ytest

# Fit a polynomial model on the training data
mymodel = numpy.poly1d(numpy.polyfit(train_x, train_y, 3))

# Calculate R² score for training and testing data
train_r2 = r2_score(train_y, mymodel(train_x))
test_r2 = r2_score(test_y, mymodel(test_x))

# Generate x values for the polynomial line
myline = numpy.linspace(0, 6, 100)

# Plot training data points and regression line
plt.scatter(train_x, train_y, color='blue', label='Training Data')
plt.plot(myline, mymodel(myline), color='green', label='Regression Line')

# Plot testing data points
plt.scatter(test_x, test_y, color='red', label='Testing Data')
test_predict = mymodel(5)


# Annotate the graph with R² scores
plt.text(5, 100, f'Train R²: {train_r2:.2f}', fontsize=9, color='blue')
plt.text(5, 60, f'Test R²: {test_r2:.2f}', fontsize=9, color='red')
plt.text(2, 20, f'Test predict height of age 5: {test_predict:.2f}', fontsize=9, color='green')

# Add legend and labels
plt.legend()
plt.title('Polynomial Regression with R² Scores')
plt.xlabel('X')
plt.ylabel('Y')

# Save the figure to a file before showing it
plt.savefig(sys.stdout.buffer)

# Show the plot
plt.show()

# Ensure that the buffer is flushed
sys.stdout.flush()
